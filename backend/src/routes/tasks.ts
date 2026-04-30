import { Router } from 'express';
import { authMiddleware, requireRole, validate } from '../middleware';
import {
  listTasksForProject,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/taskSchemas';

/**
 * Tasks router
 *
 * GET    /api/tasks/project/:projectId  — list tasks for project (any authenticated user)
 * POST   /api/tasks                     — create task (Admin only)
 * PUT    /api/tasks/:id                 — full task update (Admin only)
 * PATCH  /api/tasks/:id/status          — status-only update (any authenticated user)
 * DELETE /api/tasks/:id                 — delete task (Admin only)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 4.5, 4.6, 4.7, 7.1, 8.1
 */
const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/tasks/project/:projectId — any authenticated user
router.get('/project/:projectId', listTasksForProject);

// POST /api/tasks — Admin only
router.post(
  '/',
  requireRole(['Admin']),
  validate(createTaskSchema),
  createTask
);

// PUT /api/tasks/:id — Admin only
router.put(
  '/:id',
  requireRole(['Admin']),
  validate(updateTaskSchema),
  updateTask
);

// PATCH /api/tasks/:id/status — any authenticated user (role check in controller)
router.patch(
  '/:id/status',
  validate(updateTaskStatusSchema),
  updateTaskStatus
);

// DELETE /api/tasks/:id — Admin only
router.delete('/:id', requireRole(['Admin']), deleteTask);

export default router;
