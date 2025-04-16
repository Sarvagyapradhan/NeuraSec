/**
 * Authentication Setup Script for NeuraSec
 * This script checks and configures the authentication system
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env.local' });

console.log('🔐 NeuraSec Authentication Setup');
console.log('================================\n');

// Check environment variables
async function checkEnvironment() {
  console.log('Checking environment variables...');
  
  // Essential variables to check
  const requiredVars = [
    'JWT_SECRET',
    'NEXT_PUBLIC_API_URL',
    'POSTGRES_HOST',
    'POSTGRES_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DATABASE'
  ];
  
  let missingVars = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    
    // Update .env.local with missing variables if it exists
    try {
      if (fs.existsSync('./.env.local')) {
        console.log('\nUpdating .env.local file with default values...');
        
        let envContent = fs.readFileSync('./.env.local', 'utf8');
        let updated = false;
        
        if (missingVars.includes('JWT_SECRET') && !envContent.includes('JWT_SECRET=')) {
          envContent += '\n# JWT Configuration\nJWT_SECRET=CHANGEME_super_secret_key_for_jwt_token_generation\n';
          updated = true;
        }
        
        if (missingVars.includes('NEXT_PUBLIC_API_URL') && !envContent.includes('NEXT_PUBLIC_API_URL=')) {
          envContent += '\n# API URL\nNEXT_PUBLIC_API_URL=http://localhost:8000\n';
          updated = true;
        }
        
        if (updated) {
          fs.writeFileSync('./.env.local', envContent);
          console.log('✓ Updated .env.local with missing variables');
          console.log('Please restart this script to continue setup');
          process.exit(0);
        }
      }
    } catch (error) {
      console.error('Error updating .env.local file:', error);
    }
    
    return false;
  }
  
  console.log('✓ All required environment variables are present');
  return true;
}

// Check database connection
async function checkDatabase() {
  console.log('\nChecking database connection...');
  
  // PostgreSQL connection configuration
  const config = {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
  };
  
  const pool = new Pool(config);
  let client;
  
  try {
    client = await pool.connect();
    console.log('✓ Successfully connected to database');
    
    // Check if User table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
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
    } else {
      console.log('✓ User table exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Create test user
async function createTestUser() {
  console.log('\nEnsuring test user exists...');
  
  const config = {
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
  };
  
  const pool = new Pool(config);
  let client;
  
  try {
    client = await pool.connect();
    
    // Check if the test user already exists
    const userCheck = await client.query(`
      SELECT * FROM "User" WHERE email = 'test@example.com';
    `);
    
    // Generate user ID and hash password
    const userId = 'usr_' + Date.now().toString();
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (userCheck.rows.length > 0) {
      // Update existing user password
      await client.query(`
        UPDATE "User" SET password = $1 WHERE email = 'test@example.com';
      `, [hashedPassword]);
      
      console.log('✓ Test user updated:');
    } else {
      // Create a new test user
      await client.query(`
        INSERT INTO "User" (id, email, username, password) 
        VALUES ($1, $2, $3, $4);
      `, [userId, 'test@example.com', 'testuser', hashedPassword]);
      
      console.log('✓ Test user created:');
    }
    
    console.log('   Email: test@example.com');
    console.log('   Username: testuser');
    console.log('   Password: password123');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    return false;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Check if backend is running
async function checkBackend() {
  console.log('\nChecking backend API service...');
  
  const { default: axios } = await import('axios');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    await axios.get(`${apiUrl}/docs`);
    console.log(`✓ Backend API is running at ${apiUrl}`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Backend API is not running at ${apiUrl}`);
      console.log('Please start the backend API service in a separate terminal:');
      console.log('   cd backend');
      console.log('   python run.py');
    } else {
      console.log(`❌ Error checking backend: ${error.message}`);
    }
    return false;
  }
}

// Run the setup
async function runSetup() {
  const envOk = await checkEnvironment();
  if (!envOk) {
    console.log('\n❌ Environment setup failed. Please fix the issues and try again.');
    return;
  }
  
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\n❌ Database setup failed. Please fix the issues and try again.');
    return;
  }
  
  const userOk = await createTestUser();
  if (!userOk) {
    console.log('\n❌ User setup failed. Please fix the issues and try again.');
    return;
  }
  
  const backendOk = await checkBackend();
  
  console.log('\n✅ Authentication setup completed successfully!');
  console.log('You can now login with:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
  
  if (!backendOk) {
    console.log('\n⚠️ Warning: Backend API is not running');
    console.log('Some features requiring the backend API may not work properly.');
  }
  
  console.log('\nTo start the Next.js development server:');
  console.log('   npm run dev');
}

// Run the setup
runSetup(); 