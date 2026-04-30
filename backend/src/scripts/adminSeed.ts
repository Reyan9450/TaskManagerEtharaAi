/**
 * adminSeed.ts
 *
 * Seeds the database with an Admin user (and an optional Member user) for
 * local development and Postman testing.
 *
 * Usage:
 *   npx ts-node-dev --transpile-only src/scripts/adminSeed.ts
 *   -- or, after adding the npm script --
 *   npm run seed
 *
 * The script is idempotent: if a user with the given email already exists it
 * will be skipped rather than duplicated.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User';

const BCRYPT_COST = 12;

const SEEDS = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin1234!',
    role: 'Admin' as const,
  },
  {
    name: 'Member User',
    email: 'member@example.com',
    password: 'Member1234!',
    role: 'Member' as const,
  },
];

async function seed(): Promise<void> {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in .env — aborting.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB');

  for (const s of SEEDS) {
    const existing = await User.findOne({ email: s.email });

    if (existing) {
      console.log(`⏭   ${s.role} "${s.email}" already exists — skipping.`);
      continue;
    }

    const passwordHash = await bcrypt.hash(s.password, BCRYPT_COST);

    await User.create({
      name: s.name,
      email: s.email,
      passwordHash,
      role: s.role,
    });

    console.log(`✅  Created ${s.role}: ${s.email}  /  password: ${s.password}`);
  }

  await mongoose.disconnect();
  console.log('✅  Done — disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
