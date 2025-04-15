import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Reuse the pool connection logic from the scan-url route
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const host = process.env.POSTGRES_HOST;
    const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
    const database = process.env.POSTGRES_DATABASE;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;

    if (!host || !database || !user || !password) {
      console.error('Missing PostgreSQL connection details in environment variables');
      return null;
    }

    try {
      pool = new Pool({
        host,
        port,
        database,
        user,
        password,
        ssl: {
          // Disable certificate validation to resolve self-signed certificate issue
          rejectUnauthorized: false
        },
        connectionTimeoutMillis: 10000, // 10 seconds
      });

      pool.on('error', (err) => {
        console.error('PostgreSQL pool error:', err);
        pool = null; // Reset pool on error
      });
    } catch (err) {
      console.error('Failed to create PostgreSQL pool:', err);
      return null;
    }
  }
  return pool;
}

export async function POST(request: Request) {
  try {
    const { url, originalVerdict, userVerdict, comment } = await request.json();

    // Basic validation
    if (!url || !originalVerdict || !userVerdict) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate verdict values
    const validVerdicts = ['Safe', 'Suspicious', 'Malicious'];
    if (!validVerdicts.includes(userVerdict)) {
      return NextResponse.json({ error: 'Invalid user verdict' }, { status: 400 });
    }

    console.log(`Received feedback for URL: ${url} - Original: ${originalVerdict}, User: ${userVerdict}`);

    // Get client IP for tracking (optional)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const db = getPool();
    if (!db) {
      console.error('Database connection not available');
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Check if feedback for this URL and user verdict already exists
    const existingQuery = `
      SELECT id, feedback_count FROM url_scan_feedback 
      WHERE url = $1 AND user_verdict = $2
    `;
    
    const existingResult = await db.query(existingQuery, [url, userVerdict]);
    
    let feedbackId;
    
    if (existingResult.rows.length > 0) {
      // Update existing feedback count
      const updateQuery = `
        UPDATE url_scan_feedback 
        SET feedback_count = feedback_count + 1,
            submitted_at = NOW(),
            user_comment = COALESCE($1, user_comment)
        WHERE id = $2
        RETURNING id
      `;
      
      const updateResult = await db.query(updateQuery, [
        comment || null, 
        existingResult.rows[0].id
      ]);
      
      feedbackId = updateResult.rows[0].id;
      console.log(`Updated existing feedback #${feedbackId}, new count: ${existingResult.rows[0].feedback_count + 1}`);
    } else {
      // Insert new feedback
      const insertQuery = `
        INSERT INTO url_scan_feedback(
          url, original_verdict, user_verdict, user_comment, user_ip
        ) VALUES($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const insertResult = await db.query(insertQuery, [
        url, 
        originalVerdict,
        userVerdict,
        comment || null,
        ip
      ]);
      
      feedbackId = insertResult.rows[0].id;
      console.log(`Created new feedback #${feedbackId}`);
    }

    // Get total feedback count by verdict for this URL
    const statsQuery = `
      SELECT user_verdict, SUM(feedback_count) as count
      FROM url_scan_feedback
      WHERE url = $1
      GROUP BY user_verdict
      ORDER BY count DESC
    `;
    
    const statsResult = await db.query(statsQuery, [url]);
    
    // Calculate majority verdict if available
    let majorityVerdict = null;
    let totalFeedbacks = 0;
    
    if (statsResult.rows.length > 0) {
      totalFeedbacks = statsResult.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
      majorityVerdict = statsResult.rows[0].user_verdict; // Top verdict by count
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      feedbackStats: statsResult.rows,
      totalFeedbacks,
      majorityVerdict
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}

// Also support GET to retrieve feedback stats for a URL
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }
  
  try {
    const db = getPool();
    if (!db) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }
    
    // Get feedback stats for this URL
    const statsQuery = `
      SELECT user_verdict, SUM(feedback_count) as count
      FROM url_scan_feedback
      WHERE url = $1
      GROUP BY user_verdict
      ORDER BY count DESC
    `;
    
    const statsResult = await db.query(statsQuery, [url]);
    
    // Calculate majority verdict and total
    let majorityVerdict = null;
    let totalFeedbacks = 0;
    
    if (statsResult.rows.length > 0) {
      totalFeedbacks = statsResult.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
      majorityVerdict = statsResult.rows[0].user_verdict;
    }
    
    return NextResponse.json({
      url,
      feedbackStats: statsResult.rows,
      totalFeedbacks,
      majorityVerdict,
      hasFeedback: statsResult.rows.length > 0
    });
    
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback stats' }, { status: 500 });
  }
} 