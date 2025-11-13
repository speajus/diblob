/**
 * Database seeding script using drizzle-seed
 * 
 * This script populates the database with sample data for development and testing.
 * Run with: npm run db:seed
 */

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { reset, seed } from 'drizzle-seed';
import * as schema from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Check if --reset flag is provided
  const shouldReset = process.argv.includes('--reset');
  
  console.log('🌱 Starting database seeding...\n');
  
  if (shouldReset) {
    console.log('🔄 Reset mode enabled - will clear existing data\n');
  }

  // Ensure data directory exists
  const dataDir = join(__dirname, '../../data');
  mkdirSync(dataDir, { recursive: true });

  // Initialize database connection
  const dbPath = join(dataDir, 'app.db');
  console.log(`📂 Database path: ${dbPath}`);
  
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { schema });

  // Create tables if they don't exist
  console.log('📋 Creating tables if needed...');
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  // Reset database if requested
  if (shouldReset) {
    console.log('🗑️  Resetting database...');
    await reset(db as any, schema);
    console.log('✅ Database reset complete\n');
  }

  // Seed the database with sample data using refinements for realistic data
  console.log('🌱 Seeding users table with realistic data...');

  await seed(db as any, schema, {
    count: 20,  // Generate 20 sample users
    seed: 12345 // Use a fixed seed for reproducible data
  }).refine((funcs) => ({
    users: {
      columns: {
        name: funcs.fullName(),
        email: funcs.email(),
        createdAt: funcs.date({ 
          minDate: '2023-01-01', 
          maxDate: '2024-12-31' 
        })
      }
    }
  }));

  console.log('✅ Database seeding completed!\n');
  
  // Display some stats
  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  console.log(`📊 Total users in database: ${userCount.count}`);

  // Close the database connection
  sqlite.close();
  console.log('\n✨ Done!');
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

