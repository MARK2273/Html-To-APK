import { Router } from 'express';
import { SystemController } from '../controllers/systemController.js';

const router = Router();

router.get('/status', SystemController.getStatus);
router.get('/dashboard', SystemController.getDashboardStats);
router.post('/diag', SystemController.executeDiag);

export default router;

