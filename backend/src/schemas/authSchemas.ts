import Joi from 'joi';

/**
 * registerSchema
 *
 * Joi validation schema for POST /api/auth/register.
 * Validates: name (required string), email (valid email, required),
 * password (string, min 8 chars, required).
 *
 * Requirements: 1.3, 1.4, 12.1, 12.2, 12.3
 */
export const registerSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'name is required',
    'string.empty': 'name is required',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'email is required',
    'string.empty': 'email is required',
    'string.email': 'email must be a valid email address',
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'password is required',
    'string.empty': 'password is required',
    'string.min': 'password must be at least 8 characters',
  }),
});

/**
 * loginSchema
 *
 * Joi validation schema for POST /api/auth/login.
 * Validates: email (valid email, required), password (string, required).
 *
 * Requirements: 2.1, 12.1, 12.2, 12.3
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'any.required': 'email is required',
    'string.empty': 'email is required',
    'string.email': 'email must be a valid email address',
  }),
  password: Joi.string().required().messages({
    'any.required': 'password is required',
    'string.empty': 'password is required',
  }),
});
