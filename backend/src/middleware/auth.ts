import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  role: 'Admin' | 'Member';
}

/**
 * authMiddleware
 *
 * Extracts and verifies a JWT from the `Authorization: Bearer <token>` header.
 * On success, attaches `{ id, role }` to `req.user` and calls `next()`.
 * Returns 401 if the header is missing or the token is invalid/expired.
 *
 * Requirements: 3.1, 3.2, 3.3
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // Misconfigured server — treat as internal error
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
