import { spawn } from "node:child_process";

export async function executeCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0 || stdout) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command ${command} exited with code ${code}: ${stderr}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}