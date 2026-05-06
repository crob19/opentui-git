import { spawn } from "node:child_process";
import { platform } from "node:os";
import which from "which";

export namespace Clipboard {
  export async function copy(text: string): Promise<void> {
    const os = platform();

    try {
      if (os === "darwin") {
        await pipe("pbcopy", [], text);
      } else if (os === "linux") {
        if (
          process.env["WAYLAND_DISPLAY"] &&
          (await which("wl-copy", { nothrow: true }))
        ) {
          await pipe("wl-copy", [], text);
        } else if (await which("xclip", { nothrow: true })) {
          await pipe("xclip", ["-selection", "clipboard"], text);
        } else {
          console.warn(
            "Clipboard copy skipped: no suitable clipboard utility found (expected 'wl-copy' for Wayland or 'xclip' for X11).",
          );
        }
      } else if (os === "win32") {
        const escaped = text.replace(/"/g, '""');
        await pipe(
          "powershell",
          ["-command", `Set-Clipboard -Value "${escaped}"`],
          null,
        );
      }
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  }
}

function pipe(
  cmd: string,
  args: string[],
  stdin: string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: [stdin === null ? "ignore" : "pipe", "ignore", "ignore"],
    });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    if (stdin !== null && proc.stdin) {
      proc.stdin.end(stdin);
    }
  });
}
