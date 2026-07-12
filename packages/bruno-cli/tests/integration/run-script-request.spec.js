const { describe, it, expect, afterEach } = require('@jest/globals');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const CLI_BIN = path.resolve(__dirname, '..', '..', 'bin', 'bru.js');

describe('CLI run — script request', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('executes the script through bruno-requests with resolved collection vars, args and env', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bru-cli-script-request-'));
    fs.writeFileSync(path.join(tmpDir, 'opencollection.yml'), `opencollection: "1.0.0"
info:
  name: script-cli-collection
request:
  variables:
    - name: message
      value: SCRIPT_CLI_OK
      enabled: true
`);
    fs.writeFileSync(path.join(tmpDir, 'script.yml'), `info:
  name: cli-script
  type: script
  seq: 1
script:
  path: ${JSON.stringify(process.execPath)}
  args:
    - value: -e
      enabled: true
    - value: "process.stdout.write(process.env.MESSAGE + ':' + process.argv[1])"
      enabled: true
    - value: resolved-arg
      enabled: true
  env:
    - name: MESSAGE
      value: "{{message}}"
      enabled: true
`);

    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [CLI_BIN, 'run', 'script.yml'], {
        cwd: tmpDir,
        env: { ...process.env }
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', (code) => resolve({ code, stdout, stderr }));
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('SCRIPT_CLI_OK:resolved-arg');
    expect(result.stdout).toContain('script (OK)');
  }, 30_000);
});
