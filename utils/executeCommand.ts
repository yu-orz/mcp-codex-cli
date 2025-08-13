import { spawn } from "node:child_process";

export async function executeCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = "";
    let stderr = "";

    // 120秒のタイムアウトを設定
    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error(`Command ${command} timed out after 120 seconds`));
    }, 120000);

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0 || stdout) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command ${command} exited with code ${code}: ${stderr}`));
      }
    });

    process.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}