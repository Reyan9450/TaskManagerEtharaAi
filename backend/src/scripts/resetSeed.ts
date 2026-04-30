/**
 * resetSeed.ts
 *
 * Drops all Users, Projects, and Tasks from the database,
 * then runs the full demo seed for a clean slate.
 *
 * Usage:
 *   npm run seed:reset
 *
 * ⚠️  WARNING: This deletes ALL data. Use only in development.
 */

import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import User from '../models/User'
import Project from '../models/Project'
import Task from '../models/Task'

async function reset() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in .env — aborting.')
    process.exit(1)
  }

  await mongoose.connect(MONGO_URI)
  console.log('✅  Connected to MongoDB')

  const { deletedCount: tasks }    = await Task.deleteMany({})
  const { deletedCount: projects } = await Project.deleteMany({})
  const { deletedCount: users }    = await User.deleteMany({})

  console.log(`🗑   Deleted: ${tasks} tasks, ${projects} projects, ${users} users`)

  await mongoose.disconnect()
  console.log('✅  Reset complete. Run `npm run seed:demo` to re-seed.\n')
}

reset().catch((err) => {
  console.error('❌  Reset failed:', err)
  process.exit(1)
})
