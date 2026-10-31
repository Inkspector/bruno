const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const path = require('path');
const http = require('http');
const { runCli } = require('../helpers/run-cli');
const { copyFixtureToTmpDir, removeTmpDir } = require('../helpers/tmp-dir');

const RUN_TIMEOUT = 60000;

// Both folders hold a request named "Get Fact"; only folder2's loops back, twice, to whatever
// `nextRequestTarget` points at:
//
//   folder1/Get Fact   -> GET /fact?from=folder1
//   folder2/Get Fact   -> GET /fact?from=folder2, then setNextRequest(nextRequestTarget) while loops < 2
describe('CLI run — bru.runner.setNextRequest by path', () => {
  const fixtureDir = path.join(__dirname, 'fixtures', 'bru-collection');

  let server;
  let baseUrl;
  let workDir;
  let hits;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const from = new URL(req.url, 'http://localhost').searchParams.get('from');
      hits[from] = (hits[from] || 0) + 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    hits = {};
    workDir = copyFixtureToTmpDir(fixtureDir, 'set-next-request-by-path');
  });

  afterEach(() => {
    removeTmpDir(workDir);
    workDir = null;
  });

  const runCollection = async (nextRequestTarget) => {
    const result = await runCli(
      [
        'run',
        '--env-var', `host=${baseUrl}`,
        '--env-var', `nextRequestTarget=${nextRequestTarget}`,
        '--noproxy'
      ],
      workDir
    );

    if (result.code !== 0) {
      throw new Error(
        `CLI exited with code ${result.code}.\n--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}`
      );
    }

    return result;
  };

  it('jumps to the request at the given path when another request shares its name', async () => {
    await runCollection('folder2/Get Fact');

    expect(hits).toEqual({ folder1: 1, folder2: 3 });
  }, RUN_TIMEOUT);

  it('accepts the path with the request file extension', async () => {
    await runCollection('folder2/Get Fact.bru');

    expect(hits).toEqual({ folder1: 1, folder2: 3 });
  }, RUN_TIMEOUT);

  it('keeps resolving a plain name to the first request with that name', async () => {
    await runCollection('Get Fact');

    expect(hits).toEqual({ folder1: 3, folder2: 3 });
  }, RUN_TIMEOUT);
});
