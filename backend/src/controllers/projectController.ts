import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Project from '../models/Project';
import Task from '../models/Task';

/**
 * listProjects
 *
 * Handles GET /api/projects.
 * Returns all projects where the authenticated user is the admin
 * or is listed in the members array.
 *
 * Requirements: 5.4
 */
export async function listProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const projects = await Project.find({
      $or: [{ admin: userId }, { members: userId }],
    });

    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
}

/**
 * createProject
 *
 * Handles POST /api/projects (Admin only).
 * Creates a new project with the authenticated user as admin and an empty
 * members array.
 *
 * Requirements: 5.1, 5.6
 */
export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description } = req.body as {
      title: string;
      description?: string;
    };

    const project = await Project.create({
      title,
      description,
      admin: req.user!.id,
      members: [],
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

/**
 * addMember
 *
 * Handles POST /api/projects/:id/members (Admin only).
 * Adds a userId to the project's members array (idempotent via $addToSet).
 * Returns 404 if the project is not found.
 *
 * Requirements: 5.2
 */
export async function addMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.body as { userId: string };

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $addToSet: { members: new Types.ObjectId(userId) } },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
}

/**
 * removeMember
 *
 * Handles DELETE /api/projects/:id/members/:userId (Admin only).
 * Removes a userId from the project's members array using $pull.
 * Returns 404 if the project is not found.
 *
 * Requirements: 5.3
 */
export async function removeMember(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, userId } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      id,
      { $pull: { members: new Types.ObjectId(userId) } },
      { new: true }
    );

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
}

/**
 * deleteProject
 *
 * Handles DELETE /api/projects/:id (Admin only).
 * Deletes the project document and cascades deletion to all associated Task
 * documents where projectId matches.
 * Returns 404 if the project is not found.
 *
 * Requirements: 5.5
 */
export async function deleteProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Cascade: remove all tasks belonging to this project
    await Task.deleteMany({ projectId: new Types.ObjectId(id) });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}
