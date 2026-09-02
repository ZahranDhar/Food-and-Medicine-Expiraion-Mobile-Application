import { Router } from 'express';
import { signup, login, getCurrentUser } from '../controllers/authController';
import protect from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (token required)
// Called by AuthContext.bootstrapAsync() on app launch to verify stored token
router.get('/me', protect, getCurrentUser);

export default router;
