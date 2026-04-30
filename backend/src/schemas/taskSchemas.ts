import Joi from 'joi';

/**
 * createTaskSchema
 *
 * Joi validation schema for POST /api/tasks.
 * Validates:
 *   - title (string, required)
 *   - projectId (string, required)
 *   - description (string, optional)
 *   - assignedTo (string, required)
 *   - status (string, enum Todo/In Progress/Done, optional, default 'Todo')
 *   - dueDate (ISO 8601 date string, required)
 *
 * Requirements: 6.1, 6.6, 12.1, 12.2, 12.4
 */
export const createTaskSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'title is required',
    'string.empty': 'title is required',
  }),
  projectId: Joi.string().required().messages({
    'any.required': 'projectId is required',
    'string.empty': 'projectId is required',
  }),
  description: Joi.string().optional().allow(''),
  assignedTo: Joi.string().required().messages({
    'any.required': 'assignedTo is required',
    'string.empty': 'assignedTo is required',
  }),
  status: Joi.string()
    .valid('Todo', 'In Progress', 'Done')
    .optional()
    .default('Todo')
    .messages({
      'any.only': 'status must be one of Todo, In Progress, Done',
    }),
  dueDate: Joi.string().isoDate().required().messages({
    'any.required': 'dueDate is required',
    'string.isoDate': 'dueDate must be a valid ISO 8601 date string',
  }),
});

/**
 * updateTaskSchema
 *
 * Joi validation schema for PUT /api/tasks/:id.
 * All fields are optional — only provided fields will be updated.
 *
 * Requirements: 6.3, 12.1, 12.2, 12.4
 */
export const updateTaskSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  assignedTo: Joi.string().optional(),
  status: Joi.string()
    .valid('Todo', 'In Progress', 'Done')
    .optional()
    .messages({
      'any.only': 'status must be one of Todo, In Progress, Done',
    }),
  dueDate: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'dueDate must be a valid ISO 8601 date string',
  }),
});

/**
 * updateTaskStatusSchema
 *
 * Joi validation schema for PATCH /api/tasks/:id/status.
 * Validates: status (string, enum Todo/In Progress/Done, required)
 *
 * Requirements: 6.4, 12.1, 12.2
 */
export const updateTaskStatusSchema = Joi.object({
  status: Joi.string()
    .valid('Todo', 'In Progress', 'Done')
    .required()
    .messages({
      'any.required': 'status is required',
      'any.only': 'status must be one of Todo, In Progress, Done',
    }),
});
