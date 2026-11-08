import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { ProjectController } from '../controllers/projectController.js';
import { getUploadsDir } from '../utils/paths.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadsDir()),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max file
});

const router = Router();

router.post('/', ProjectController.create);
router.get('/', ProjectController.list);
router.get('/:id', ProjectController.get);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

// File management & uploads
router.post('/:id/upload', upload.array('files'), ProjectController.uploadFiles);
router.post('/:id/icon', upload.single('icon'), ProjectController.uploadIcon);
router.get('/:id/files', ProjectController.getFiles);

// Live preview endpoint
router.get('/:id/preview', ProjectController.preview);
router.get('/:id/preview/*', ProjectController.preview);

export default router;

