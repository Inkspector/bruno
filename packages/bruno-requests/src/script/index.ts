import { spawn } from 'child_process';
import path from 'path';

export type ScriptExecution = {
  filePath: string;
  args?: string[];
  env?: any;
  cwd?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
};

/** Execute a local script without a shell. Keeping shell disabled avoids quoting
 * differences and command injection on Windows, macOS and Linux. */
export const executeScript = ({ filePath, args = [], env, cwd, onStdout, onStderr }: ScriptExecution) => new Promise<{
  stdout: string; stderr: string; output: string; exitCode: number;
}>((resolve, reject) => {
  // cmd.exe is required for .bat/.cmd; POSIX shell scripts are deliberately
  // passed to sh so they do not need their executable bit set.
  const extension = path.extname(filePath).toLowerCase();
  const command = process.platform === 'win32' && ['.bat', '.cmd'].includes(extension) ? 'cmd.exe' : extension === '.sh' ? '/bin/sh' : filePath;
  const commandArgs = process.platform === 'win32' && ['.bat', '.cmd'].includes(extension)
    ? ['/d', '/s', '/c', filePath, ...args]
    : extension === '.sh' ? [filePath, ...args] : args;
  const child = spawn(command, commandArgs, { cwd, env, shell: false, windowsHide: true });
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
  child.once('error', reject);
  child.once('close', (exitCode) => resolve({ stdout, stderr, output, exitCode: exitCode ?? 1 }));
});
