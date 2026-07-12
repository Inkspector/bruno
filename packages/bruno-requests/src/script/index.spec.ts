import { executeScript, executeScriptRequest, resolveScriptRequest } from './index';

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

  it('resolves every Bruno variable scope with the standard precedence', () => {
    const resolved = resolveScriptRequest({
      request: {
        url: '{{script}}',
        args: [{ value: '{{value}}', enabled: true }],
        env: [{ name: 'RESULT', value: '{{collectionOnly}}/{{process.env.HOME}}', enabled: true }]
      },
      globalEnvironmentVariables: { value: 'global' },
      collectionVariables: { value: 'collection', collectionOnly: 'collection' },
      envVariables: { value: 'environment' },
      folderVariables: { value: 'folder' },
      requestVariables: { value: 'request', script: process.execPath },
      runtimeVariables: { value: 'runtime' },
      processEnvVars: { HOME: '/tmp/home' },
      promptVariables: { value: 'prompt' }
    });

    expect(resolved).toEqual({
      filePath: process.execPath,
      args: ['prompt'],
      env: { RESULT: 'collection//tmp/home' }
    });
  });

  it('executes a resolved script request and returns transport-neutral request/response data', async () => {
    const execution = await executeScriptRequest({
      request: {
        url: process.execPath,
        args: [{ value: '-e' }, { value: 'process.stdout.write(process.env.MESSAGE + \':\' + process.argv[1])' }, { value: '{{name}}' }],
        env: [{ name: 'MESSAGE', value: '{{message}}', enabled: true }]
      },
      collectionPath: process.cwd(),
      collectionVariables: { message: 'hello' },
      runtimeVariables: { name: 'cli-and-electron' }
    });

    expect(execution.output).toBe('hello:cli-and-electron');
    expect(execution.requestSent).toMatchObject({ method: 'SCRIPT', data: ['-e', expect.any(String), 'cli-and-electron'] });
    expect(execution.response).toMatchObject({ status: 200, data: 'hello:cli-and-electron', isError: false });
  });
});
