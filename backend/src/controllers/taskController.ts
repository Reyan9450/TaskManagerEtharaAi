import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Task from '../models/Task';
import Project from '../models/Project';
import { computeTaskFields } from '../utils/priorityEngine';

/**
 * Helper: populate assignedTo with { _id, name } and attach computed fields.
 * Returns a plain object with priorityScore, priorityLevel, and isOverdue spread in.
 */
function withComputedFields(task: {
  toObject: () => Record<string, unknown>;
  dueDate: Date;
  createdAt: Date;
  status: 'Todo' | 'In Progress' | 'Done';
}): Record<string, unknown> {
  const plain = task.toObject();
  const computed = computeTaskFields({
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    status: task.status,
  });
  return { ...plain, ...computed };
}

/**
 * listTasksForProject
 *
 * Handles GET /api/tasks/project/:projectId.
 * - Admin: returns all tasks for the project
 * - Member: returns only tasks where assignedTo === req.user.id
 * Populates assignedTo with { _id, name }.
 * Attaches computed priorityScore, priorityLevel, isOverdue to each task.
 *
 * Requirements: 6.2, 4.5, 4.6, 7.1, 8.1
 */
export async function listTasksForProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { id: userId, role } = req.user!;

    const filter: Record<string, unknown> = { projectId };

    if (role === 'Member') {
      filter.assignedTo = new Types.ObjectId(userId);
    }

    const tasks = await Task.find(filter).populate('assignedTo', 'name');

    const tasksWithFields = tasks.map((task) => withComputedFields(task));

    res.status(200).json(tasksWithFields);
  } catch (err) {
    next(err);
  }
}

/**
 * createTask
 *
 * Handles POST /api/tasks (Admin only).
 * - Validates that assignedTo is a member of the project (or the project admin)
 * - Sets createdAt to current UTC
 * - Returns 201 with created task + computed fields
 *
 * Requirements: 6.1, 6.6, 6.7
 */
export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, projectId, description, assignedTo, status, dueDate } =
      req.body as {
        title: string;
        projectId: string;
        description?: string;
        assignedTo: string;
        status?: string;
        dueDate: string;
      };

    // Verify assignedTo is a member of the project
    if (!Types.ObjectId.isValid(projectId)) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = await Project.findById(projectId);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const assignedToId = new Types.ObjectId(assignedTo);
    const isMember = project.members.some((m) => m.equals(assignedToId));
    const isAdmin = project.admin.equals(assignedToId);

    if (!isMember && !isAdmin) {
      res
        .status(422)
        .json({ error: 'assignedTo user is not a member of this project' });
      return;
    }

    const task = await Task.create({
      title,
      projectId: new Types.ObjectId(projectId),
      description,
      assignedTo: assignedToId,
      status: status ?? 'Todo',
      dueDate: new Date(dueDate),
      createdAt: new Date(),
    });

    const populated = await task.populate('assignedTo', 'name');

    res.status(201).json(withComputedFields(populated));
  } catch (err) {
    next(err);
  }
}

/**
 * updateTask
 *
 * Handles PUT /api/tasks/:id (Admin only).
 * - Finds task by _id; returns 404 if not found
 * - If assignedTo is being updated, verifies it's a project member (422 if not)
 * - Updates specified fields; returns updated task + computed fields
 *
 * Requirements: 6.3, 7.6
 */
export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const existingTask = await Task.findById(id);

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { title, description, assignedTo, status, dueDate } = req.body as {
      title?: string;
      description?: string;
      assignedTo?: string;
      status?: string;
      dueDate?: string;
    };

    // If assignedTo is being updated, verify project membership
    if (assignedTo !== undefined) {
      const project = await Project.findById(existingTask.projectId);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      const assignedToId = new Types.ObjectId(assignedTo);
      const isMember = project.members.some((m) => m.equals(assignedToId));
      const isAdmin = project.admin.equals(assignedToId);

      if (!isMember && !isAdmin) {
        res
          .status(422)
          .json({ error: 'assignedTo user is not a member of this project' });
        return;
      }
    }

    // Build update object with only provided fields
    const updateFields: Record<string, unknown> = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (assignedTo !== undefined)
      updateFields.assignedTo = new Types.ObjectId(assignedTo);
    if (status !== undefined) updateFields.status = status;
    if (dueDate !== undefined) updateFields.dueDate = new Date(dueDate);

    const updatedTask = await Task.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).populate('assignedTo', 'name');

    if (!updatedTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json(withComputedFields(updatedTask));
  } catch (err) {
    next(err);
  }
}

/**
 * updateTaskStatus
 *
 * Handles PATCH /api/tasks/:id/status (any authenticated user).
 * - Finds task by _id; returns 404 if not found
 * - If Member: verifies task.assignedTo === req.user.id; returns 403 if not
 * - Updates only the status field
 * - Returns updated task + computed fields
 *
 * Requirements: 6.4, 4.7
 */
export async function updateTaskStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user!;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Members can only update status of tasks assigned to them
    if (role === 'Member') {
      if (task.assignedTo.toString() !== userId) {
        res
          .status(403)
          .json({ error: 'Forbidden: you can only update your own tasks' });
        return;
      }
    }

    const { status } = req.body as { status: string };

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('assignedTo', 'name');

    if (!updatedTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json(withComputedFields(updatedTask));
  } catch (err) {
    next(err);
  }
}

/**
 * deleteTask
 *
 * Handles DELETE /api/tasks/:id (Admin only).
 * - Finds task by _id; returns 404 if not found
 * - Deletes the task document
 * - Returns 200 { message: 'Task deleted successfully' }
 *
 * Requirements: 6.5
 */
export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
}
