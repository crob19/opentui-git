import { platform } from "os";

/**
 * Simple clipboard utility for copying text
 */
export namespace Clipboard {
  export async function copy(text: string): Promise<void> {
    const os = platform();

    try {
      if (os === "darwin") {
        // macOS - use pbcopy
        const proc = Bun.spawn(["pbcopy"], {
          stdin: "pipe",
          stdout: "ignore",
          stderr: "ignore",
        });
        proc.stdin.write(text);
        proc.stdin.end();
        await proc.exited;
      } else if (os === "linux") {
        // Linux - try wl-copy (Wayland) or xclip (X11)
        if (process.env["WAYLAND_DISPLAY"] && Bun.which("wl-copy")) {
          const proc = Bun.spawn(["wl-copy"], {
            stdin: "pipe",
            stdout: "ignore",
            stderr: "ignore",
          });
          proc.stdin.write(text);
          proc.stdin.end();
          await proc.exited;
        } else if (Bun.which("xclip")) {
          const proc = Bun.spawn(["xclip", "-selection", "clipboard"], {
            stdin: "pipe",
            stdout: "ignore",
            stderr: "ignore",
          });
          proc.stdin.write(text);
          proc.stdin.end();
          await proc.exited;
        } else {
          console.warn(
            "Clipboard copy skipped: no suitable clipboard utility found (expected 'wl-copy' for Wayland or 'xclip' for X11)."
          );
        }
      } else if (os === "win32") {
        // Windows - use powershell
        const escaped = text.replace(/"/g, '""');
        const proc = Bun.spawn(["powershell", "-command", `Set-Clipboard -Value "${escaped}"`], {
          stdin: "ignore",
          stdout: "ignore",
          stderr: "ignore",
        });
        const exitCode = await proc.exited;
        if (exitCode !== 0) {
          throw new Error(`Failed to copy text to clipboard (exit code ${exitCode})`);
        }
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  }
}
