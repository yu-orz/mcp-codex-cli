import { spawn } from "node:child_process";
import { DEFAULT_COMMAND_TIMEOUT_MS } from "../constants.ts";

export async function executeCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    // タイムアウトを設定
    const timeout = setTimeout(() => {
      process.kill();
      reject(
        new Error(
          `Command ${command} timed out after ${DEFAULT_COMMAND_TIMEOUT_MS / 1000} seconds`,
        ),
      );
    }, DEFAULT_COMMAND_TIMEOUT_MS);

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(`Command ${command} exited with code ${code}: ${stderr}`),
        );
      }
    });

    process.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}
