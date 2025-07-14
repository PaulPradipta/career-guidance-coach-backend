const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const db = require('../db');

// Create a resume
router.post('/', resumeController.createResume);

// Get all resumes (for listing)
router.get('/all-resumes', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, role FROM users');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all resumes:', err);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// Get a specific resume by ID
router.get('/:id', resumeController.getResumeById);

// Delete a specific resume by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    await conn.execute('DELETE FROM users WHERE id = ?', [id]);
    // Add additional delete queries for related tables (experiences, education, etc.) if necessary

    res.status(204).end(); // 204 No Content on successful deletion
  } catch (err) {
    console.error(`Error deleting resume with ID ${id}:`, err);
    res.status(500).json({ error: 'Failed to delete resume' });
  } finally {
    conn.release();
  }
});

module.exports = router;
