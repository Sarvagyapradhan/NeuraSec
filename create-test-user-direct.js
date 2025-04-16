const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env.local' });

// PostgreSQL connection configuration
const config = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Connecting to database...');

// Create a new connection pool
const pool = new Pool(config);

async function createTestUser() {
  let client;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('✓ Successfully connected to database');
    
    // Check if User table exists
    try {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'User'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ The User table does not exist in the database.');
        console.log('Creating User table...');
        
        // Create User table
        await client.query(`
          CREATE TABLE "User" (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✓ User table created successfully');
      }
    } catch (err) {
      console.error('Error checking/creating User table:', err);
      throw err;
    }
    
    // Check if the test user already exists
    const userCheck = await client.query(`
      SELECT * FROM "User" WHERE email = 'test@example.com';
    `);
    
    // Generate user ID and hash password
    const userId = 'usr_' + Date.now().toString();
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (userCheck.rows.length > 0) {
      // Update existing user
      console.log('Test user already exists, updating password...');
      
      await client.query(`
        UPDATE "User" 
        SET password = $1 
        WHERE email = 'test@example.com';
      `, [hashedPassword]);
      
      console.log(`✓ Updated test user with email: test@example.com`);
      console.log(`Password: ${password}`);
    } else {
      // Create a new test user
      await client.query(`
        INSERT INTO "User" (id, email, username, password) 
        VALUES ($1, $2, $3, $4);
      `, [userId, 'test@example.com', 'testuser', hashedPassword]);
      
      console.log(`✓ Created test user: test@example.com`);
      console.log(`Username: testuser`);
      console.log(`Password: ${password}`);
    }
    
    console.log('Test user created/updated successfully');
  } catch (error) {
    console.error('Failed to create test user:', error.message);
    console.error('Error details:', error);
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    
    // Close the pool
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
}

// Run the function
createTestUser(); 