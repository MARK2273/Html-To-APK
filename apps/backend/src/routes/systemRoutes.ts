import { Router } from 'express';
import { SystemController } from '../controllers/systemController.js';

const router = Router();

router.get('/status', SystemController.getStatus);
router.get('/dashboard', SystemController.getDashboardStats);

export default router;

