import { spawn } from 'child_process';
import path from 'path';

export type ScriptExecution = {
  filePath: string;
  args?: string[];
  env?: any;
  cwd?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  signal?: AbortSignal;
};

/** Execute a local script without a shell. Keeping shell disabled avoids quoting
 * differences and command injection on Windows, macOS and Linux. */
export const executeScript = ({ filePath, args = [], env, cwd, onStdout, onStderr, signal }: ScriptExecution) => new Promise<{
  stdout: string; stderr: string; output: string; exitCode: number;
}>((resolve, reject) => {
  // cmd.exe is required for .bat/.cmd; POSIX shell scripts are deliberately
  // passed to sh so they do not need their executable bit set.
  const extension = path.extname(filePath).toLowerCase();
  const command = process.platform === 'win32' && ['.bat', '.cmd'].includes(extension) ? 'cmd.exe' : extension === '.sh' ? '/bin/sh' : filePath;
  const commandArgs = process.platform === 'win32' && ['.bat', '.cmd'].includes(extension)
    ? ['/d', '/s', '/c', filePath, ...args]
    : extension === '.sh' ? [filePath, ...args] : args;
  const child = spawn(command, commandArgs, {
    cwd,
    env,
    shell: false,
    windowsHide: true,
    detached: process.platform !== 'win32'
  });
  let settled = false;
  const abort = () => {
    if (settled) return;
    if (process.platform !== 'win32' && child.pid) {
      try {
        // Kill the whole process group so children launched by shell scripts
        // (for example ping) do not survive their parent.
        process.kill(-child.pid, 'SIGTERM');
      } catch (error) {
        child.kill();
      }
    } else if (process.platform === 'win32' && child.pid) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
    } else {
      child.kill();
    }
    settled = true;
    reject(new Error('Request cancelled'));
  };
  if (signal?.aborted) {
    abort();
    return;
  }
  signal?.addEventListener('abort', abort, { once: true });
  let stdout = '';
  let stderr = '';
  let output = '';
  child.stdout?.on('data', (data) => {
    const chunk = data.toString();
    stdout += chunk;
    output += chunk;
    onStdout?.(chunk);
  });
  child.stderr?.on('data', (data) => {
    const chunk = data.toString();
    stderr += chunk;
    output += chunk;
    onStderr?.(chunk);
  });
  child.once('error', (error) => {
    if (settled) return;
    settled = true;
    signal?.removeEventListener('abort', abort);
    reject(error);
  });
  child.once('close', (exitCode) => {
    if (settled) return;
    settled = true;
    signal?.removeEventListener('abort', abort);
    resolve({ stdout, stderr, output, exitCode: exitCode ?? 1 });
  });
});
