import { executeScript } from './index';

describe('executeScript streaming', () => {
  it('reports stdout and stderr chunks while preserving the combined output', async () => {
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const result = await executeScript({
      filePath: process.execPath,
      args: ['-e', 'process.stdout.write(\'stdout\'); process.stderr.write(\'stderr\');'],
      onStdout: (chunk) => stdoutChunks.push(chunk),
      onStderr: (chunk) => stderrChunks.push(chunk)
    });

    expect(result.exitCode).toBe(0);
    expect(stdoutChunks.join('')).toBe('stdout');
    expect(stderrChunks.join('')).toBe('stderr');
    expect(result.output).toContain('stdout');
    expect(result.output).toContain('stderr');
  });

  it('terminates the child process when aborted', async () => {
    const controller = new AbortController();
    const execution = executeScript({
      filePath: process.execPath,
      args: ['-e', 'setInterval(() => {}, 1000)'],
      signal: controller.signal
    });

    controller.abort();

    await expect(execution).rejects.toThrow('Request cancelled');
  });
});
