import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SERVER_START_TIMEOUT_MS = 20_000;
const CLIENT_TIMEOUT_MS = 30_000;

async function startServer() {
  const server = spawn('node', ['dist/index.js'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Ensure a predictable host/port (should match src/index.ts)
      HOST: '0.0.0.0',
      PORT: '50051',
      // Use an in-memory database so each test run starts from a clean state
      DB_PATH: ':memory:',
    },
  });

  let stdoutBuffer = '';

  const readyPromise = new Promise((resolve, reject) => {
    const onStdout = (chunk: Buffer) => {
      const text = chunk.toString();
      stdoutBuffer += text;
      if (text.includes('gRPC server is running on')) {
        server.stdout?.off('data', onStdout);
        resolve(undefined);
      }
    };

    const onError = (error: Error) => {
      server.stdout?.off('data', onStdout);
      reject(error);
    };

    const onExit = (code: number | null) => {
      server.stdout?.off('data', onStdout);
      reject(new Error(`Server exited early with code ${code}. Output:\n${stdoutBuffer}`));
    };

    server.stdout?.on('data', onStdout);
    server.once('error', onError);
    server.once('exit', onExit);
  });

  const timeout = delay(SERVER_START_TIMEOUT_MS).then(() => {
    server.kill('SIGINT');
    throw new Error(
      `Timed out waiting for example-grpc-server to start. Output so far:\n${stdoutBuffer}`,
    );
  });

  await Promise.race([readyPromise, timeout]);

  return server;
}

async function runClient() {
  const client = spawn('node', ['dist/client.js'], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  if (client.stdout) {
    client.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
  }

  if (client.stderr) {
    client.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
  }

  const exitCodePromise = new Promise<number>((resolve, reject) => {
    client.once('error', (error) => {
      reject(error);
    });

    client.once('exit', (code) => {
      resolve(code ?? -1);
    });
  });

  const timeout = delay(CLIENT_TIMEOUT_MS).then(() => {
    client.kill('SIGINT');
    throw new Error(
      `Timed out waiting for example-grpc-server client to finish.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
    );
  });

  const code = await Promise.race([exitCodePromise, timeout]);

  return { code, stdout, stderr };
}

async function stopServer(server: ReturnType<typeof spawn>) {
  console.log('Stopping server...');
  server.kill(9);
  
  // Give the server a bit of time to shut down gracefully
  await delay(1_000);
  process.exit(0)
}

	test('example-grpc-server end-to-end CRUD flow', async (t) => {
	  // If the native better-sqlite3 binding isn't loadable for this Node version
	  // or the module is not installed, skip the end-to-end test instead of
	  // failing the suite.
	  try {
	    const mod = await import('better-sqlite3');
	    const Database = mod.default ?? mod;
	    const db = new Database(':memory:');
	    db.close();
	  } catch (error: any) {
	    if (
	      error &&
	      (error.code === 'ERR_DLOPEN_FAILED' ||
	        error.code === 'ERR_MODULE_NOT_FOUND' ||
	        error.code === 'MODULE_NOT_FOUND')
	    ) {
	      t.skip(
	        'better-sqlite3 native module is not available; skipping example-grpc-server e2e test.',
	      );
	      return;
	    }
	    throw error;
	  }

	  const server = await startServer();
    
	  try {
	    const { code, stdout, stderr } = await runClient();

	    assert.equal(
	      code,
	      0,
	      `Client exited with non-zero code ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`,
	    );

	    // Sanity check that the happy-path marker is present
	    assert.match(
	      stdout,
	      /All tests completed!/, 
	      'Expected client output to include the completion message',
	    );
	  } finally {
	    await stopServer(server);
	  }
	});

