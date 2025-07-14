const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Paul@1234',          // your MySQL password
  database: 'resume_builder',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection and log message
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database successfully connected');
    connection.release(); // return to pool
  }
});

module.exports = pool.promise();
