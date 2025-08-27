const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, resumeController.createResume);
router.get('/', authMiddleware, resumeController.getMyResumes);
router.get('/:id', authMiddleware, resumeController.getResumeById);
router.delete('/:id', authMiddleware, resumeController.deleteResumeById);

module.exports = router;
