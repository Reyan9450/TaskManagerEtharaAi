import Joi from 'joi';

/**
 * createProjectSchema
 *
 * Joi validation schema for POST /api/projects.
 * Validates: title (required string), description (optional string).
 *
 * Requirements: 5.1, 5.6, 12.1, 12.2
 */
export const createProjectSchema = Joi.object({
  title: Joi.string().required().messages({
    'any.required': 'title is required',
    'string.empty': 'title is required',
  }),
  description: Joi.string().optional().allow(''),
});

/**
 * addMemberSchema
 *
 * Joi validation schema for POST /api/projects/:id/members.
 * Validates: userId (required string).
 *
 * Requirements: 5.2, 12.1, 12.2
 */
export const addMemberSchema = Joi.object({
  userId: Joi.string().required().messages({
    'any.required': 'userId is required',
    'string.empty': 'userId is required',
  }),
});
