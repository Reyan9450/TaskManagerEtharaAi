import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * requireRole
 *
 * Factory that returns an Express middleware which checks whether the
 * authenticated user's role is included in the `roles` allow-list.
 *
 * Must be used after `authMiddleware` so that `req.user` is populated.
 * Returns 403 if the role is insufficient or if `req.user` is absent.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function requireRole(roles: Array<'Admin' | 'Member'>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
}
