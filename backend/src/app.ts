import express from 'express'
import cors from 'cors'

import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import tasksRouter from './routes/tasks'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// CORS — read allowed origins from environment variable
// If CORS_ORIGIN is set, split by comma and trim each entry.
// Otherwise default to localhost:5173 (Vite dev server).
const corsOrigins: string[] = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173']

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)

// Body parsing
app.use(express.json())

// Health check — useful for Railway deployment checks
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Route handlers
app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/tasks', tasksRouter)

// Centralised error handler — must be registered LAST
app.use(errorHandler)

export default app
