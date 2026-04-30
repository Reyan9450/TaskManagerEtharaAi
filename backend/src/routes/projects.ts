import { Router } from 'express';
import { authMiddleware, requireRole, validate } from '../middleware';
import {
  listProjects,
  createProject,
  addMember,
  removeMember,
  deleteProject,
} from '../controllers/projectController';
import { createProjectSchema, addMemberSchema } from '../schemas/projectSchemas';

/**
 * Projects router
 *
 * GET    /api/projects                        — list projects for current user (any authenticated)
 * POST   /api/projects                        — create project (Admin only)
 * POST   /api/projects/:id/members            — add member to project (Admin only)
 * DELETE /api/projects/:id/members/:userId    — remove member from project (Admin only)
 * DELETE /api/projects/:id                    — delete project + cascade tasks (Admin only)
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/projects — any authenticated user
router.get('/', listProjects);

// POST /api/projects — Admin only
router.post(
  '/',
  requireRole(['Admin']),
  validate(createProjectSchema),
  createProject
);

// POST /api/projects/:id/members — Admin only
router.post(
  '/:id/members',
  requireRole(['Admin']),
  validate(addMemberSchema),
  addMember
);

// DELETE /api/projects/:id/members/:userId — Admin only
router.delete(
  '/:id/members/:userId',
  requireRole(['Admin']),
  removeMember
);

// DELETE /api/projects/:id — Admin only
router.delete(
  '/:id',
  requireRole(['Admin']),
  deleteProject
);

export default router;
