import { spawn } from 'child_process';
import path from 'path';
import { interpolate } from '@usebruno/common';

export type ScriptExecution = {
  filePath: string;
  args?: string[];
  env?: any;
  cwd?: string;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  signal?: AbortSignal;
};

export type ScriptRequestExecution = {
  request: any;
  collectionPath: string;
  globalEnvironmentVariables?: Record<string, any>;
  collectionVariables?: Record<string, any>;
  envVariables?: Record<string, any>;
  folderVariables?: Record<string, any>;
  requestVariables?: Record<string, any>;
  runtimeVariables?: Record<string, any>;
  processEnvVars?: Record<string, any>;
  promptVariables?: Record<string, any>;
  baseProcessEnv?: any;
  signal?: AbortSignal;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  onStart?: (requestSent: { url: string; method: string; headers: Record<string, string>; data: string[]; timestamp: number }) => void;
};

export const resolveScriptRequest = ({
  request,
  globalEnvironmentVariables = {},
  collectionVariables = request?.collectionVariables || {},
  envVariables = {},
  folderVariables = request?.folderVariables || {},
  requestVariables = request?.requestVariables || {},
  runtimeVariables = {},
  processEnvVars = {},
  promptVariables = {}
}: Omit<ScriptRequestExecution, 'collectionPath'>) => {
  const resolvedEnvironmentVariables = { ...envVariables };
  Object.entries(resolvedEnvironmentVariables).forEach(([name, value]) => {
    resolvedEnvironmentVariables[name] = interpolate(value, { process: { env: processEnvVars } });
  });

  const variables = {
    ...globalEnvironmentVariables,
    ...collectionVariables,
    ...resolvedEnvironmentVariables,
    ...folderVariables,
    ...requestVariables,
    ...runtimeVariables,
    ...promptVariables,
    process: { env: processEnvVars }
  };
  const resolve = (value: any) => interpolate(String(value ?? ''), variables);
  const args = (request?.args || [])
    .filter((arg: any) => arg?.enabled !== false)
    .map((arg: any) => resolve(typeof arg === 'object' ? arg.value : arg));
  const env = (request?.env || [])
    .filter((entry: any) => entry?.enabled !== false && entry?.name)
    .reduce((result: Record<string, string>, entry: any) => {
      result[resolve(entry.name)] = resolve(entry.value);
      return result;
    }, {});

  return { filePath: resolve(request?.url), args, env };
};

export const executeScriptRequest = async (options: ScriptRequestExecution) => {
  const { request, collectionPath, baseProcessEnv = process.env, signal, onStdout, onStderr } = options;
  const resolved = resolveScriptRequest(options);
  const startedAt = Date.now();
  const requestSent = {
    url: resolved.filePath,
    method: 'SCRIPT',
    headers: resolved.env,
    data: resolved.args,
    timestamp: startedAt
  };
  options.onStart?.(requestSent);
  const result = await executeScript({
    filePath: resolved.filePath,
    args: resolved.args,
    env: { ...baseProcessEnv, ...resolved.env },
    cwd: collectionPath,
    signal,
    onStdout,
    onStderr
  });
  const duration = Date.now() - startedAt;
  const output = result.output ?? (result.stderr
    ? `${result.stdout}${result.stdout && !result.stdout.endsWith('\n') ? '\n' : ''}${result.stderr}`
    : result.stdout);

  return {
    ...result,
    output,
    duration,
    requestSent,
    response: {
      status: result.exitCode === 0 ? 200 : result.exitCode,
      statusText: result.exitCode === 0 ? 'Script completed' : `Script exited with code ${result.exitCode}`,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      data: output,
      dataBuffer: Buffer.from(output),
      size: Buffer.byteLength(output),
      duration,
      isError: result.exitCode !== 0
    }
  };
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
