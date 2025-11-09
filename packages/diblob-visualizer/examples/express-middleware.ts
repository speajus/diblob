/**
 * Example: Using diblob-visualizer as Express middleware
 * 
 * This demonstrates how to embed the visualizer into an existing Express application
 */

import express from 'express';
import { createContainer, createBlob } from '@speajus/diblob';
import { createVisualizerMiddleware } from '../src/middleware/express.js';

// Define some example services
interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }
}

interface Database {
  query(sql: string): Promise<any>;
}

class PostgresDatabase implements Database {
  constructor(private logger: Logger) {}
  
  async query(sql: string): Promise<any> {
    this.logger.log(`Executing query: ${sql}`);
    return [];
  }
}

// Create container and register services
const container = createContainer();
const loggerBlob = createBlob<Logger>();
const databaseBlob = createBlob<Database>();

container.register(loggerBlob, ConsoleLogger);
container.register(databaseBlob, PostgresDatabase, [loggerBlob]);

// Create Express app
const app = express();

// Add the visualizer middleware at /visualizer
app.use(createVisualizerMiddleware({
  container,
  path: '/visualizer',
  updateInterval: 1000,
  cors: true
}));

// Add some example routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Express App with Diblob Visualizer</h1>
    <p>The visualizer is available at:</p>
    <ul>
      <li><a href="/visualizer/events">SSE Endpoint</a></li>
      <li><a href="/visualizer/graph">Graph API</a></li>
      <li><a href="/visualizer/health">Health Check</a></li>
    </ul>
  `);
});

app.get('/api/data', async (req, res) => {
  const db = container.resolve(databaseBlob);
  const results = await db.query('SELECT * FROM users');
  res.json(results);
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n🚀 Express server running at http://localhost:${PORT}`);
  console.log(`📊 Visualizer endpoints:`);
  console.log(`   SSE:    http://localhost:${PORT}/visualizer/events`);
  console.log(`   Graph:  http://localhost:${PORT}/visualizer/graph`);
  console.log(`   Health: http://localhost:${PORT}/visualizer/health\n`);
});

