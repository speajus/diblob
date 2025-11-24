/**
 * Database seeding script using drizzle-seed
 * 
 * This script populates the database with sample data for development and testing.
 * Run with: npm run db:seed
 */

import { createContainer } from '@speajus/diblob';
import { reset, seed } from 'drizzle-seed';
import { database, sqlite } from '../drizzle.js';
import { registerDrizzleBlobs } from '../register.js';
import * as schema from './schema.js';

async function registerSeed(shouldReset = false, ctx = createContainer()) {
	  const dbPath = './data/app.db';
	  registerDrizzleBlobs(ctx, dbPath);
  console.log('🌱 Starting database seeding...\n');
  
  if (shouldReset) {
    console.log('🔄 Reset mode enabled - will clear existing data\n');
  }

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
	    // biome-ignore lint/suspicious/noExplicitAny: drizzle-seed does not do the types correctly for SQLBetter3
	    await reset(database as any, { users: schema.users });
	    console.log('✅ Database reset complete\n');
	  }

   // Seed the database with sample data using refinements for realistic data
   console.log('🌱 Seeding users table with realistic data...');

	  // biome-ignore lint/suspicious/noExplicitAny: drizzle-seed does not do the types correctly for SQLBetter3
	  await seed(database as any, schema, {
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
  await ctx.dispose();
  console.log('\n✨ Done!');
}

registerSeed(process.argv.includes('--reset')).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

