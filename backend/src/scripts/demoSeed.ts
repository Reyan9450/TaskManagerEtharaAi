/**
 * demoSeed.ts
 *
 * Seeds the database with realistic demo data:
 *   - 1 Admin user
 *   - 3 Member users
 *   - 3 Projects (admin owns all, members distributed across them)
 *   - 15 Tasks spread across projects with varied statuses, due dates, and assignees
 *
 * Usage:
 *   npm run seed:demo
 *
 * The script is idempotent — it checks for existing data before inserting.
 * Run `npm run seed:reset` first if you want a clean slate.
 */

import dotenv from 'dotenv'
dotenv.config()

import mongoose, { Types } from 'mongoose'
import bcrypt from 'bcrypt'
import User from '../models/User'
import Project from '../models/Project'
import Task from '../models/Task'

const BCRYPT_COST = 12

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Date offset by `days` from today (negative = past) */
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns a Date offset by `days` from today for createdAt */
function createdDaysAgo(days: number): Date {
  return daysFromNow(-days)
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const USERS = [
  { name: 'Alice Admin',   email: 'admin@example.com',   password: 'Admin1234!',  role: 'Admin'  as const },
  { name: 'Bob Builder',   email: 'bob@example.com',     password: 'Member1234!', role: 'Member' as const },
  { name: 'Carol Chen',    email: 'carol@example.com',   password: 'Member1234!', role: 'Member' as const },
  { name: 'David Diaz',    email: 'david@example.com',   password: 'Member1234!', role: 'Member' as const },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌  MONGO_URI is not set in .env — aborting.')
    process.exit(1)
  }

  await mongoose.connect(MONGO_URI)
  console.log('✅  Connected to MongoDB\n')

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('👤  Seeding users…')
  const userMap: Record<string, Types.ObjectId> = {}

  for (const u of USERS) {
    let user = await User.findOne({ email: u.email })
    if (user) {
      console.log(`   ⏭  ${u.role} "${u.email}" already exists — skipping`)
    } else {
      const passwordHash = await bcrypt.hash(u.password, BCRYPT_COST)
      user = await User.create({ name: u.name, email: u.email, passwordHash, role: u.role })
      console.log(`   ✅  Created ${u.role}: ${u.email}  /  password: ${u.password}`)
    }
    userMap[u.email] = user._id as Types.ObjectId
  }

  const adminId  = userMap['admin@example.com']
  const bobId    = userMap['bob@example.com']
  const carolId  = userMap['carol@example.com']
  const davidId  = userMap['david@example.com']

  // ── 2. Projects ───────────────────────────────────────────────────────────
  console.log('\n📁  Seeding projects…')

  const projectDefs = [
    {
      title: 'Website Redesign',
      description: 'Overhaul the company website with a modern design and improved UX.',
      members: [bobId, carolId],
    },
    {
      title: 'Mobile App v2',
      description: 'Build the second version of the mobile app with offline support.',
      members: [bobId, davidId],
    },
    {
      title: 'Data Pipeline',
      description: 'Automate ETL workflows and improve reporting infrastructure.',
      members: [carolId, davidId],
    },
  ]

  const projectMap: Record<string, Types.ObjectId> = {}

  for (const p of projectDefs) {
    let project = await Project.findOne({ title: p.title, admin: adminId })
    if (project) {
      console.log(`   ⏭  Project "${p.title}" already exists — skipping`)
    } else {
      project = await Project.create({
        title: p.title,
        description: p.description,
        admin: adminId,
        members: p.members,
      })
      console.log(`   ✅  Created project: "${p.title}"`)
    }
    projectMap[p.title] = project._id as Types.ObjectId
  }

  const websiteId  = projectMap['Website Redesign']
  const mobileId   = projectMap['Mobile App v2']
  const pipelineId = projectMap['Data Pipeline']

  // ── 3. Tasks ──────────────────────────────────────────────────────────────
  console.log('\n📋  Seeding tasks…')

  const taskDefs = [
    // ── Website Redesign ──
    {
      title: 'Design new homepage mockup',
      description: 'Create Figma mockups for the redesigned homepage including hero section.',
      projectId: websiteId,
      assignedTo: bobId,
      status: 'Done'        as const,
      dueDate: daysFromNow(-5),
      createdAt: createdDaysAgo(20),
    },
    {
      title: 'Implement responsive navbar',
      description: 'Build the top navigation bar with mobile hamburger menu.',
      projectId: websiteId,
      assignedTo: carolId,
      status: 'In Progress' as const,
      dueDate: daysFromNow(3),
      createdAt: createdDaysAgo(10),
    },
    {
      title: 'Write SEO meta tags',
      description: 'Add proper meta descriptions and Open Graph tags to all pages.',
      projectId: websiteId,
      assignedTo: bobId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(7),
      createdAt: createdDaysAgo(5),
    },
    {
      title: 'Optimise images for web',
      description: 'Compress and convert all images to WebP format.',
      projectId: websiteId,
      assignedTo: carolId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(-2),   // overdue
      createdAt: createdDaysAgo(15),
    },
    {
      title: 'Set up CI/CD pipeline for frontend',
      description: 'Configure GitHub Actions to deploy to Vercel on every merge to main.',
      projectId: websiteId,
      assignedTo: bobId,
      status: 'Done'        as const,
      dueDate: daysFromNow(-10),
      createdAt: createdDaysAgo(25),
    },

    // ── Mobile App v2 ──
    {
      title: 'Design offline sync architecture',
      description: 'Document the strategy for syncing local SQLite data with the backend.',
      projectId: mobileId,
      assignedTo: davidId,
      status: 'Done'        as const,
      dueDate: daysFromNow(-8),
      createdAt: createdDaysAgo(30),
    },
    {
      title: 'Implement push notifications',
      description: 'Integrate Firebase Cloud Messaging for iOS and Android.',
      projectId: mobileId,
      assignedTo: bobId,
      status: 'In Progress' as const,
      dueDate: daysFromNow(5),
      createdAt: createdDaysAgo(12),
    },
    {
      title: 'Write unit tests for auth module',
      description: 'Achieve 80% coverage on the authentication service.',
      projectId: mobileId,
      assignedTo: davidId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(10),
      createdAt: createdDaysAgo(3),
    },
    {
      title: 'Fix crash on Android 12',
      description: 'Investigate and fix the crash reported on Android 12 devices at startup.',
      projectId: mobileId,
      assignedTo: bobId,
      status: 'In Progress' as const,
      dueDate: daysFromNow(-1),   // overdue
      createdAt: createdDaysAgo(8),
    },
    {
      title: 'App Store submission',
      description: 'Prepare screenshots, release notes, and submit v2.0 to App Store.',
      projectId: mobileId,
      assignedTo: davidId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(14),
      createdAt: createdDaysAgo(2),
    },

    // ── Data Pipeline ──
    {
      title: 'Set up Apache Airflow',
      description: 'Install and configure Airflow on the data server with PostgreSQL backend.',
      projectId: pipelineId,
      assignedTo: carolId,
      status: 'Done'        as const,
      dueDate: daysFromNow(-15),
      createdAt: createdDaysAgo(35),
    },
    {
      title: 'Build sales data ETL job',
      description: 'Extract sales data from Salesforce, transform, and load into the data warehouse.',
      projectId: pipelineId,
      assignedTo: davidId,
      status: 'In Progress' as const,
      dueDate: daysFromNow(2),
      createdAt: createdDaysAgo(14),
    },
    {
      title: 'Create executive dashboard',
      description: 'Build a Metabase dashboard showing KPIs for the executive team.',
      projectId: pipelineId,
      assignedTo: carolId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(6),
      createdAt: createdDaysAgo(4),
    },
    {
      title: 'Data quality monitoring alerts',
      description: 'Set up automated alerts when data quality checks fail.',
      projectId: pipelineId,
      assignedTo: davidId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(-3),   // overdue
      createdAt: createdDaysAgo(18),
    },
    {
      title: 'Document ETL architecture',
      description: 'Write technical documentation for all ETL pipelines and data flows.',
      projectId: pipelineId,
      assignedTo: carolId,
      status: 'Todo'        as const,
      dueDate: daysFromNow(20),
      createdAt: createdDaysAgo(1),
    },
  ]

  let created = 0
  let skipped = 0

  for (const t of taskDefs) {
    const existing = await Task.findOne({ title: t.title, projectId: t.projectId })
    if (existing) {
      skipped++
      continue
    }
    await Task.create(t)
    created++
    console.log(`   ✅  "${t.title}" → ${t.status}`)
  }

  if (skipped > 0) {
    console.log(`   ⏭  ${skipped} task(s) already existed — skipped`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────')
  console.log('🎉  Demo seed complete!\n')
  console.log('  Login credentials:')
  console.log('  ┌─────────────────────────────────────────────┐')
  console.log('  │  Role    Email                  Password     │')
  console.log('  │─────────────────────────────────────────────│')
  console.log('  │  Admin   admin@example.com      Admin1234!   │')
  console.log('  │  Member  bob@example.com        Member1234!  │')
  console.log('  │  Member  carol@example.com      Member1234!  │')
  console.log('  │  Member  david@example.com      Member1234!  │')
  console.log('  └─────────────────────────────────────────────┘')
  console.log(`\n  Projects: 3  |  Tasks created: ${created}  |  Tasks skipped: ${skipped}`)
  console.log('─────────────────────────────────────────\n')

  await mongoose.disconnect()
  console.log('✅  Disconnected from MongoDB.')
}

seed().catch((err) => {
  console.error('❌  Demo seed failed:', err)
  process.exit(1)
})
