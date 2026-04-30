import { Router } from 'express';
import { validate } from '../middleware/validate';
import { register, login } from '../controllers/authController';
import { registerSchema, loginSchema } from '../schemas/authSchemas';

/**
 * Auth router
 *
 * POST /api/auth/register — register a new user
 * POST /api/auth/login    — authenticate an existing user
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4
 */
const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
