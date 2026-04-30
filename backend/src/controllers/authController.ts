import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const BCRYPT_COST = 12;
const JWT_EXPIRY = '7d';

/**
 * register
 *
 * Handles POST /api/auth/register.
 * - Hashes the password with bcrypt (cost 12)
 * - Creates a new User document (role defaults to 'Member')
 * - Signs a JWT with { id, role } payload
 * - Returns 201 { token, user: { id, name, email, role } }
 * - Returns 409 on duplicate email (MongoDB error code 11000)
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const user = await User.create({ name, email, passwordHash });

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      secret,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    // MongoDB duplicate key error
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    ) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    next(err);
  }
}

/**
 * login
 *
 * Handles POST /api/auth/login.
 * - Finds user by email (case-insensitive via lowercase field on schema)
 * - Returns 401 if user not found
 * - Compares password with bcrypt; returns 401 on mismatch
 * - Signs a JWT with { id, role } payload (expiry '7d')
 * - Returns 200 { token, user: { id, name, email, role } }
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // The User schema stores email as lowercase, so the query is case-insensitive
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      secret,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
