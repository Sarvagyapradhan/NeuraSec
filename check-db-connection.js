const { Pool } = require('pg');
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

console.log('Connecting to database with config:', {
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: '********' // Hiding actual password
});

// Create a new connection pool
const pool = new Pool(config);

async function testConnection() {
  try {
    // Attempt to connect to the database
    const client = await pool.connect();
    console.log('✓ Successfully connected to database');
    
    // Execute a simple query to verify connection
    const result = await client.query('SELECT NOW() as time');
    console.log(`✓ Database query successful. Server time: ${result.rows[0].time}`);
    
    // Release the client back to the pool
    client.release();
    
    // Close the pool
    await pool.end();
    
    console.log('Connection test completed successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('Error details:', error);
    
    // Close the pool in case of error
    try {
      await pool.end();
    } catch (endError) {
      console.error('Failed to close pool:', endError.message);
    }
  }
}

// Run the test
testConnection(); 