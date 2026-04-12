// Pipeline test 1
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Database configuration
// Recommended: Use environment variables for sensitive information
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

app.get('/', async (req, res) => {
  try {
    // 1. Create 'users' table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Insert a dummy user
    const randomId = Math.floor(Math.random() * 10000);
    const dummyName = `Test User ${randomId}`;
    const dummyEmail = `testuser${randomId}@example.com`;
    
    await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
      [dummyName, dummyEmail]
    );

    // 3. Fetch and display all users from the database
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    
    // Simple HTML response to display data
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Node.js Postgres App</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f4f4f4; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .container { max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>User Directory</h1>
          <p>Each time you refresh this page, a new dummy user is inserted!</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${result.rows.map(user => `
                <tr>
                  <td>${user.id}</td>
                  <td>${user.name}</td>
                  <td>${user.email}</td>
                  <td>${user.created_at.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send(`
      <h1>Database Error</h1>
      <p>Error details: ${err.message}</p>
      <p>Please ensure your PostgreSQL server is running and the credentials in server.js are correct.</p>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open your browser at http://localhost:${port} to see the app in action.`);
});
