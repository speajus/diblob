#!/usr/bin/env node
/**
 * CLI for diblob-visualizer
 * 
 * Starts a standalone server that serves the visualizer interface
 */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CLIOptions {
  port?: number;
  host?: string;
  cors?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    port: 3000,
    host: 'localhost',
    cors: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-p':
      case '--port':
        options.port = parseInt(args[++i], 10);
        break;
      case '-h':
      case '--host':
        options.host = args[++i];
        break;
      case '--no-cors':
        options.cors = false;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Diblob Visualizer CLI

Usage: diblob-visualizer [options]

Options:
  -p, --port <port>    Port to listen on (default: 3000)
  -h, --host <host>    Host to bind to (default: localhost)
  --no-cors            Disable CORS
  --help               Show this help message

Examples:
  diblob-visualizer
  diblob-visualizer --port 8080
  diblob-visualizer --host 0.0.0.0 --port 3000
`);
}

function startServer(options: CLIOptions) {
  const { port = 3000, host = 'localhost', cors = true } = options;

  const server = createServer((req, res) => {
    // CORS headers
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve the visualizer HTML
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const htmlPath = join(__dirname, '../cli-assets/index.html');
        const html = readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } catch {
        res.writeHead(500);
        res.end('Error loading visualizer');
      }
      return;
    }

    // Serve JS bundle
    if (req.url?.startsWith('/assets/')) {
      try {
        const assetPath = join(__dirname, '../cli-assets', req.url);
        const content = readFileSync(assetPath, 'utf-8');
        const ext = req.url.split('.').pop();
        const contentType = ext === 'js' ? 'application/javascript' :
                           ext === 'css' ? 'text/css' : 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Asset not found');
      }
      return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
  });

  server.listen(port, host, () => {
    console.log(`\n🎨 Diblob Visualizer running at:`);
    console.log(`   http://${host}:${port}\n`);
    console.log(`Press Ctrl+C to stop the server\n`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down server...');
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });
}

// Run CLI
const options = parseArgs();
startServer(options);

