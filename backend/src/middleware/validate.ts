import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';

/**
 * validate
 *
 * Factory that returns an Express middleware which validates `req.body`
 * against the provided Joi schema.
 *
 * On success: calls `next()`.
 * On failure: returns 400 with a structured list of field-level errors.
 * The service layer is never invoked on validation failure.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export function validate(schema: Joi.ObjectSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({ error: 'Validation failed', details });
      return;
    }

    next();
  };
}
