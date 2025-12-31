use std::collections::VecDeque;
use std::net::{SocketAddr, TcpListener};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use std::path::PathBuf;
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindow};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
use tokio::net::TcpSocket;

/// State to track the sidecar child process
#[derive(Clone)]
struct ServerState(Arc<Mutex<Option<CommandChild>>>);

/// State to collect sidecar logs for debugging
#[derive(Clone)]
struct LogState(Arc<Mutex<VecDeque<String>>>);

const MAX_LOG_ENTRIES: usize = 200;
const SERVER_TIMEOUT_SECS: u64 = 10;

/// Kill the sidecar process
#[tauri::command]
fn kill_sidecar(app: AppHandle) {
    let Some(server_state) = app.try_state::<ServerState>() else {
        println!("[tauri] Server not running");
        return;
    };

    let Some(child) = server_state
        .0
        .lock()
        .expect("Failed to acquire mutex lock")
        .take()
    else {
        println!("[tauri] Server state missing");
        return;
    };

    let _ = child.kill();
    println!("[tauri] Killed sidecar server");
}

/// Get collected logs from the sidecar
#[tauri::command]
async fn get_logs(app: AppHandle) -> Result<String, String> {
    let log_state = app.try_state::<LogState>().ok_or("Log state not found")?;
    let guard = log_state.0.lock().map_err(|e| format!("Failed to acquire lock on log state: {}", e))?;
    Ok(guard.iter().cloned().collect::<Vec<_>>().join(""))
}

/// Find a free port to use for the server
fn get_sidecar_port() -> u32 {
    // Check for environment variable first
    if let Ok(port_str) = std::env::var("OPENTUI_PORT") {
        if let Ok(port) = port_str.parse::<u32>() {
            return port;
        }
    }

    // Find a free port
    TcpListener::bind("127.0.0.1:0")
        .expect("Failed to bind to find free port")
        .local_addr()
        .expect("Failed to get local address")
        .port() as u32
}

/// Get the user's shell (for macOS/Linux)
fn get_user_shell() -> String {
    std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string())
}

/// Check if the shell is fish (which uses different flags)
fn is_fish_shell(shell: &str) -> bool {
    shell.ends_with("/fish") || shell == "fish"
}

/// Get the appropriate shell flags for login/interactive mode
fn get_shell_flags(shell: &str) -> Vec<&'static str> {
    if is_fish_shell(shell) {
        // fish uses -l for login, doesn't support -i the same way
        vec!["-l", "-c"]
    } else {
        // bash, zsh, sh all support -il -c
        vec!["-il", "-c"]
    }
}

/// Get the repository path
/// Priority:
/// 1. OPENTUI_REPO environment variable
/// 2. .repo-path file (written by predev script)
/// 3. Current working directory (fallback)
fn get_repo_path() -> String {
    // Check for environment variable first
    if let Ok(repo) = std::env::var("OPENTUI_REPO") {
        if !repo.is_empty() {
            return repo;
        }
    }

    // Check for .repo-path file written by predev script
    // This file is next to the executable or in src-tauri during dev
    let repo_path_file = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(".repo-path");
    if let Ok(contents) = std::fs::read_to_string(&repo_path_file) {
        let path = contents.trim().to_string();
        if !path.is_empty() {
            return path;
        }
    }

    // Fallback to current directory
    std::env::current_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| ".".to_string())
}

/// Check if the server is running by attempting a TCP connection
async fn is_server_running(port: u32) -> bool {
    let socket = match TcpSocket::new_v4() {
        Ok(s) => s,
        Err(_) => return false,
    };

    let addr: SocketAddr = format!("127.0.0.1:{}", port)
        .parse()
        .expect("Failed to parse address");

    socket.connect(addr).await.is_ok()
}

/// Spawn the sidecar server process
fn spawn_sidecar(app: &AppHandle, port: u32, repo_path: &str) -> CommandChild {
    let log_state = app.state::<LogState>();
    let log_state_clone = log_state.inner().clone();

    // On Windows: Direct sidecar execution
    #[cfg(target_os = "windows")]
    let (mut rx, child) = app
        .shell()
        .sidecar("opentui-git-server")
        .expect("Failed to create sidecar command")
        .args(["--port", &port.to_string(), "--repo", repo_path])
        .spawn()
        .expect("Failed to spawn sidecar");

    // On macOS/Linux: Execute through user's shell with login flags
    // This ensures the user's PATH and environment is loaded
    #[cfg(not(target_os = "windows"))]
    let (mut rx, child) = {
        let sidecar_path = tauri::utils::platform::current_exe()
            .expect("Failed to get current exe")
            .parent()
            .expect("Failed to get parent dir")
            .join("opentui-git-server");
        
        let shell = get_user_shell();
        let shell_flags = get_shell_flags(&shell);
        
        let command_str = format!(
            "{} --port {} --repo \"{}\"",
            sidecar_path.display(),
            port,
            repo_path
        );

        let mut args: Vec<&str> = shell_flags;
        args.push(&command_str);
        
        app.shell()
            .command(&shell)
            .args(&args)
            .spawn()
            .expect("Failed to spawn sidecar")
    };

    println!(
        "[tauri] Spawned sidecar on port {} for repo: {}",
        port, repo_path
    );

    // Collect stdout/stderr asynchronously
    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    print!("{}", line);

                    if let Ok(mut logs) = log_state_clone.0.lock() {
                        logs.push_back(format!("[stdout] {}", line));
                        while logs.len() > MAX_LOG_ENTRIES {
                            logs.pop_front();
                        }
                    }
                }
                CommandEvent::Stderr(line_bytes) => {
                    let line = String::from_utf8_lossy(&line_bytes);
                    eprint!("{}", line);

                    if let Ok(mut logs) = log_state_clone.0.lock() {
                        logs.push_back(format!("[stderr] {}", line));
                        while logs.len() > MAX_LOG_ENTRIES {
                            logs.pop_front();
                        }
                    }
                }
                CommandEvent::Error(err) => {
                    eprintln!("[tauri] Sidecar error: {}", err);
                }
                CommandEvent::Terminated(status) => {
                    println!("[tauri] Sidecar terminated with status: {:?}", status);
                    break;
                }
                _ => {}
            }
        }
    });

    child
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![kill_sidecar, get_logs])
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Initialize log state
            app_handle.manage(LogState(Arc::new(Mutex::new(VecDeque::new()))));

            tauri::async_runtime::spawn(async move {
                let port = get_sidecar_port();

                // Get the repository path (from env var, .repo-path file, or current dir)
                let repo_path = get_repo_path();

                println!("[tauri] Starting server on port {}", port);
                println!("[tauri] Repository path: {}", repo_path);

                // Check if server is already running (for development)
                let should_spawn = !is_server_running(port).await;

                let child = if should_spawn {
                    let child = spawn_sidecar(&app_handle, port, &repo_path);

                    // Wait for server to be ready
                    let start = Instant::now();
                    loop {
                        if start.elapsed() > Duration::from_secs(SERVER_TIMEOUT_SECS) {
                            eprintln!(
                                "[tauri] Server failed to start within {} seconds",
                                SERVER_TIMEOUT_SECS
                            );
                            app_handle.exit(1);
                            return;
                        }

                        if is_server_running(port).await {
                            // Give the server a bit more time to warm up
                            tokio::time::sleep(Duration::from_millis(50)).await;
                            println!("[tauri] Server ready after {:?}", start.elapsed());
                            break;
                        }

                        tokio::time::sleep(Duration::from_millis(50)).await;
                    }

                    Some(child)
                } else {
                    println!("[tauri] Server already running on port {}", port);
                    None
                };

                // Create the main window with port and repo path injected
                let window = WebviewWindow::builder(
                    &app_handle,
                    "main",
                    WebviewUrl::App("/".into()),
                )
                .title("opentui-git")
                .inner_size(1200.0, 800.0)
                .min_inner_size(800.0, 600.0)
                .resizable(true)
                .initialization_script(&format!(
                    r#"
                    window.__OPENTUI__ = window.__OPENTUI__ || {{}};
                    window.__OPENTUI__.port = {};
                    window.__OPENTUI__.repoPath = {};
                    "#,
                    port,
                    serde_json::to_string(&repo_path).unwrap_or_else(|_| "\"\"".to_string())
                ))
                .build();

                match window {
                    Ok(_) => println!("[tauri] Window created successfully"),
                    Err(e) => {
                        eprintln!("[tauri] Failed to create window: {}", e);
                        app_handle.exit(1);
                    }
                }

                // Store the child process for cleanup
                app_handle.manage(ServerState(Arc::new(Mutex::new(child))));
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                println!("[tauri] Received Exit event");
                kill_sidecar(app.clone());
            }
        });
}
