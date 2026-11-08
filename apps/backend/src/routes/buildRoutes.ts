import { Router } from 'express';
import { BuildController } from '../controllers/buildController.js';

const router = Router();

router.post('/', BuildController.start);
router.get('/', BuildController.list);
router.get('/:id', BuildController.get);
router.get('/:id/status', BuildController.streamStatus);
router.get('/:id/stream', BuildController.streamStatus);
router.get('/:id/logs', BuildController.getLogs);
router.get('/:id/download', BuildController.download);

export default router;

