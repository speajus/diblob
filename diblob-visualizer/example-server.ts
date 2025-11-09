/**
 * Example server for diblob visualizer
 *
 * This demonstrates how to set up a server that exposes container data
 * via WebSocket and SSE for remote visualization.
 */

import { createVisualizerServer } from './src/server/index.js';
import {
  createSampleContainer,
  addMetricsService,
  getLoggerBlob,
  getLoggerImpl
} from './src/examples/sample-container.js';

// Create sample container
const container = createSampleContainer();
const logger = getLoggerBlob();
const ConsoleLogger = getLoggerImpl();

// Create and start the visualizer server
const server = createVisualizerServer(container, {
  port: 3001,
  host: 'localhost',
  cors: true,
  updateInterval: 1000
});

server.start().then(() => {
  console.log('\n✅ Server started successfully!');
  console.log('\nYou can now:');
  console.log('1. Open the visualizer at http://localhost:5173');
  console.log('2. Connect to SSE: http://localhost:3001/events');
  console.log('3. Connect to WebSocket: ws://localhost:3001/ws');
  console.log('4. Fetch graph data: http://localhost:3001/graph');
  console.log('\nPress Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down server...');
  await server.stop();
  console.log('Server stopped');
  process.exit(0);
});

// Simulate dynamic changes to the container
setInterval(() => {
  // Re-register logger to trigger updates
  container.register(logger, ConsoleLogger);
  console.log('Container updated - clients should see the change');
}, 10000);

