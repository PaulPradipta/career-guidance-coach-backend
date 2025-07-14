const express = require('express');
const cors = require('cors'); // Ensure 'cors' package is installed (npm install cors)
const app = express();
const resumeRoutes = require('./routes/resumeRoutes'); // Make sure path is correct

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // Enable parsing of JSON request bodies

// Route handlers
// This means any route defined in resumeRoutes.js (e.g., router.post('/'))
// will be accessible at '/api/resumes' + the route defined in router.post()
// So, router.post('/') becomes accessible at '/api/resumes/'
app.use('/api/resumes', resumeRoutes);

// Basic route for testing server health (optional)
app.get('/', (req, res) => {
  res.send('Resume Builder Backend is running!');
});

// Error handling middleware (optional but recommended for production)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// MODIFIED: Changed port to 3001
const PORT = process.env.PORT || 3001; 

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Backend is ready to receive requests.');
});