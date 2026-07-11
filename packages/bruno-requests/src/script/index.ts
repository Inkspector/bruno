import { spawn } from 'child_process';
import path from 'path';

export type ScriptExecution = {
  filePath: string;
  args?: string[];
  env?: any;
  cwd?: string;
};

/** Execute a local script without a shell. Keeping shell disabled avoids quoting
 * differences and command injection on Windows, macOS and Linux. */
export const executeScript = ({ filePath, args = [], env, cwd }: ScriptExecution) => new Promise<{
  stdout: string; stderr: string; exitCode: number;
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
  child.stdout?.on('data', (data) => { stdout += data.toString(); });
  child.stderr?.on('data', (data) => { stderr += data.toString(); });
  child.once('error', reject);
  child.once('close', (exitCode) => resolve({ stdout, stderr, exitCode: exitCode ?? 1 }));
});
