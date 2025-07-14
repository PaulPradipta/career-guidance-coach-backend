const db = require('../db');

exports.createResume = async (req, res) => {
  const {
    name, role, phone, email, linkedin, github, summary, hasExperience,
    experiences, education, skills, projects, certifications
  } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Insert into users
    const [userResult] = await conn.execute(
      `INSERT INTO users (name, role, phone, email, linkedin, github, summary, has_experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, role, phone, email, linkedin, github, summary, hasExperience]
    );
    const userId = userResult.insertId;

    // Experience
    for (const exp of experiences || []) {
      const [expResult] = await conn.execute(
        `INSERT INTO experiences (user_id, company, role, start_year, end_year, is_current)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, exp.company, exp.role, exp.startYear, exp.endYear, exp.isCurrent]
      );
      const expId = expResult.insertId;

      for (const point of exp.responsibilities || []) {
        if (point.trim()) {
          await conn.execute(
            `INSERT INTO responsibilities (experience_id, description) VALUES (?, ?)`,
            [expId, point]
          );
        }
      }
    }

    // Education
    for (const edu of education || []) {
      await conn.execute(
        `INSERT INTO education (user_id, school, degree, start_year, end_year, cgpa)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, edu.school, edu.degree, edu.startYear, edu.endYear, edu.cgpa]
      );
    }

    // Skills
    for (const skill of skills || []) {
      await conn.execute(
        `INSERT INTO skills (user_id, name, proficiency) VALUES (?, ?, ?)`,
        [userId, skill.name, skill.proficiency || 80]
      );
    }

    // Projects
    for (const proj of projects || []) {
      const [projResult] = await conn.execute(
        `INSERT INTO projects (user_id, name, tech_stack, live_link)
         VALUES (?, ?, ?, ?)`,
        [userId, proj.name, proj.techStack, proj.liveLink]
      );
      const projId = projResult.insertId;

      for (const desc of proj.descriptions || []) {
        if (desc.trim()) {
          await conn.execute(
            `INSERT INTO project_descriptions (project_id, description) VALUES (?, ?)`,
            [projId, desc]
          );
        }
      }
    }

    // Certifications
    for (const cert of certifications || []) {
      await conn.execute(
        `INSERT INTO certifications (user_id, title, link) VALUES (?, ?, ?)`,
        [userId, cert.title, cert.link]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Resume saved successfully', userId });
  } catch (error) {
    await conn.rollback();
    console.error('Error saving resume:', error);
    res.status(500).json({ error: 'Failed to save resume' });
  } finally {
    conn.release();
  }
};

exports.getResumeById = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    const [[user]] = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Resume not found' });

    const [experiences] = await conn.query('SELECT * FROM experiences WHERE user_id = ?', [id]);
    for (const exp of experiences) {
      const [resps] = await conn.query('SELECT description FROM responsibilities WHERE experience_id = ?', [exp.id]);
      exp.responsibilities = resps.map(r => r.description);
    }

    const [education] = await conn.query('SELECT * FROM education WHERE user_id = ?', [id]);
    const [skills] = await conn.query('SELECT * FROM skills WHERE user_id = ?', [id]);
    const [projects] = await conn.query('SELECT * FROM projects WHERE user_id = ?', [id]);
    for (const proj of projects) {
      const [descs] = await conn.query('SELECT description FROM project_descriptions WHERE project_id = ?', [proj.id]);
      proj.descriptions = descs.map(d => d.description);
    }

    const [certifications] = await conn.query('SELECT * FROM certifications WHERE user_id = ?', [id]);

    const resumeData = {
      ...user,
      experiences,
      education,
      skills,
      projects,
      certifications
    };

    res.json(resumeData);
  } catch (err) {
    console.error('Error fetching resume by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    conn.release();
  }
};

exports.deleteResumeById = async (req, res) => {
  const { id } = req.params;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Delete responsibilities linked to experiences
    const [experiences] = await conn.query('SELECT id FROM experiences WHERE user_id = ?', [id]);
    for (const exp of experiences) {
      await conn.query('DELETE FROM responsibilities WHERE experience_id = ?', [exp.id]);
    }

    // Delete project descriptions linked to projects
    const [projects] = await conn.query('SELECT id FROM projects WHERE user_id = ?', [id]);
    for (const proj of projects) {
      await conn.query('DELETE FROM project_descriptions WHERE project_id = ?', [proj.id]);
    }

    // Delete dependent tables
    await conn.query('DELETE FROM experiences WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM education WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM skills WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM certifications WHERE user_id = ?', [id]);
    await conn.query('DELETE FROM projects WHERE user_id = ?', [id]);

    // Finally delete the user
    await conn.query('DELETE FROM users WHERE id = ?', [id]);

    await conn.commit();
    res.status(204).end(); // No content
  } catch (err) {
    await conn.rollback();
    console.error(`Error deleting resume with ID ${id}:`, err);
    res.status(500).json({ error: 'Failed to delete resume' });
  } finally {
    conn.release();
  }
};
