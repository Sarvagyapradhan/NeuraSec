import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Pool } from 'pg';

// Cache duration in hours (how long a result is considered "fresh")
const CACHE_DURATION_HOURS = 6;

// Add debug mode to see detailed connection info & queries
const DEBUG_MODE = true;

// Define the structure for the analysis result, including new fields
type AnalysisResultType = {
  verdict: 'Safe' | 'Suspicious' | 'Malicious' | 'Error';
  score: number; // 0 = Safe, 1 = Malicious
  url: string;
  explanation: string;
  details?: {
    category: string;
    status: 'ok' | 'warning' | 'critical';
    description: string;
  }[];
  vendorResults?: Record<string, string>; // Store individual vendor results
  analysisId?: string; // To link to the full VT report
  categories?: string[]; // URL categories from VirusTotal
  reputation?: number; // URL reputation from VirusTotal
  lastAnalysisDate?: string; // When VirusTotal last analyzed the URL
  timesSubmitted?: number; // How many times the URL was submitted to VirusTotal
  fromCache?: boolean; // Whether this result came from cache
  communityFeedback?: {
    hasFeedback: boolean;
    majorityVerdict?: string;
    totalFeedbacks?: number;
    feedbackStats?: any[];
  };
};

// Create PostgreSQL connection pool
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
      if (DEBUG_MODE) {
        console.error({
          host: !!host ? '✓ (set)' : '✗ (missing)',
          port: !!port ? '✓ (set)' : '✗ (missing)',
          database: !!database ? '✓ (set)' : '✗ (missing)', 
          user: !!user ? '✓ (set)' : '✗ (missing)',
          password: !!password ? '✓ (set but value hidden)' : '✗ (missing)'
        });
      }
      return null;
    }

    if (DEBUG_MODE) {
      console.log('Connecting to PostgreSQL with params:', {
        host,
        port,
        database,
        user,
        // Never log actual password, just indicate it exists
        password: password ? '******' : undefined
      });
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
        // Add connection timeout
        connectionTimeoutMillis: 10000, // 10 seconds
        // Add statement timeout
        statement_timeout: 10000, // 10 seconds
      });

      // Handle pool errors
      pool.on('error', (err) => {
        console.error('PostgreSQL pool error:', err);
        pool = null; // Reset pool on error
      });
      
      // Verify connection works immediately
      if (DEBUG_MODE) {
        pool.query('SELECT NOW()')
          .then(result => console.log('PostgreSQL connection successful:', result.rows[0]))
          .catch(err => console.error('PostgreSQL test query failed:', err));
      }
    } catch (err) {
      console.error('Failed to create PostgreSQL pool:', err);
      return null;
    }
  }
  return pool;
}

// After getPool function, add a new function to ensure the table exists

async function ensureTablesExist(): Promise<boolean> {
  const db = getPool();
  if (!db) {
    console.error('Cannot ensure tables exist: database connection not available');
    return false;
  }

  try {
    // Check if the tables exist
    const tableCheckQuery = `
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'url_scan_cache') as url_scan_cache_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'url_scan_feedback') as url_scan_feedback_exists
    `;
    
    const tablesExist = await db.query(tableCheckQuery);
    
    // Create main cache table if needed
    if (!tablesExist.rows[0].url_scan_cache_exists) {
      console.log('url_scan_cache table does not exist, creating it now...');
      
      // Create the table using the same schema we defined earlier
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS url_scan_cache (
          url TEXT PRIMARY KEY,
          verdict TEXT NOT NULL,
          score REAL NOT NULL,
          explanation TEXT,
          details JSONB,
          vendor_results JSONB,
          analysis_id TEXT,
          fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          expires_at TIMESTAMPTZ NOT NULL,
          categories JSONB,
          reputation INTEGER,
          last_analysis_date TIMESTAMPTZ,
          times_submitted INTEGER,
          from_cache BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_url_scan_cache_expires_at ON url_scan_cache(expires_at);
      `;
      
      await db.query(createTableQuery);
      console.log('Successfully created url_scan_cache table');
    }
    
    // Create feedback table if needed
    if (!tablesExist.rows[0].url_scan_feedback_exists) {
      console.log('url_scan_feedback table does not exist, creating it now...');
      
      const createFeedbackTableQuery = `
        CREATE TABLE IF NOT EXISTS url_scan_feedback (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          original_verdict TEXT NOT NULL,
          user_verdict TEXT NOT NULL,
          user_comment TEXT,
          submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          user_ip TEXT,
          feedback_count INTEGER NOT NULL DEFAULT 1
        );
        
        CREATE INDEX IF NOT EXISTS idx_url_scan_feedback_url ON url_scan_feedback(url);
      `;
      
      await db.query(createFeedbackTableQuery);
      console.log('Successfully created url_scan_feedback table');
    }
    
    console.log('All required tables exist');
    return true;
  } catch (error) {
    console.error('Error ensuring tables exist:', error);
    return false;
  }
}

// Check if URL exists in cache and is not expired
async function getFromCache(url: string): Promise<AnalysisResultType | null> {
  try {
    const db = getPool();
    if (!db) {
      console.warn('Database connection not available, skipping cache check');
      return null;
    }

    // Query cache for the URL, ensuring it's not expired
    const query = `
      SELECT 
        url, verdict, score, explanation, details, vendor_results as "vendorResults", 
        analysis_id as "analysisId", categories, reputation, 
        last_analysis_date as "lastAnalysisDate", times_submitted as "timesSubmitted",
        fetched_at as "fetchedAt", expires_at as "expiresAt"
      FROM url_scan_cache 
      WHERE url = $1 AND expires_at > NOW()
    `;
    
    const result = await db.query(query, [url]);
    
    if (result.rows.length > 0) {
      console.log(`Cache hit for URL: ${url}`);
      const cachedResult = result.rows[0];
      
      // Convert to expected format and flag as from cache
      return {
        ...cachedResult,
        fromCache: true
      };
    }
    
    console.log(`Cache miss for URL: ${url}`);
    return null;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null; // Proceed without cache on error
  }
}

// Save or update URL scan result in cache
async function saveToCache(result: AnalysisResultType): Promise<void> {
  try {
    const db = getPool();
    if (!db) {
      console.warn('Database connection not available, skipping cache save');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);

    // Prepare values with better error handling
    const values = [
      result.url || '',
      result.verdict || 'Error',
      typeof result.score === 'number' ? result.score : 0,
      result.explanation || 'No explanation available',
      JSON.stringify(result.details || []),
      JSON.stringify(result.vendorResults || {}),
      result.analysisId || null,
      JSON.stringify(result.categories || []),
      result.reputation !== undefined ? result.reputation : null,
      result.lastAnalysisDate ? new Date(result.lastAnalysisDate) : null,
      result.timesSubmitted || 0,
      expiresAt
    ];

    if (DEBUG_MODE) {
      // Log query parameters, but mask any potentially sensitive data
      console.log('Attempting to save to cache with values:', {
        url: values[0],
        verdict: values[1],
        score: values[2],
        // Skip showing full explanation to keep logs cleaner
        explanation_length: values[3]?.length || 0,
        details_count: JSON.parse(values[4] || '[]').length,
        vendor_results_count: Object.keys(JSON.parse(values[5] || '{}')).length,
        analysisId: values[6],
        categories_count: JSON.parse(values[7] || '[]').length,
        reputation: values[8],
        lastAnalysisDate: values[9],
        timesSubmitted: values[10],
        expiresAt: values[11]
      });
    }

    // Use a simpler query first to test database write access
    if (DEBUG_MODE) {
      try {
        const testResult = await db.query('INSERT INTO url_scan_cache_test (url, fetched_at) VALUES ($1, NOW()) ON CONFLICT (url) DO UPDATE SET fetched_at = NOW() RETURNING *', [result.url]);
        console.log('Test write successful:', testResult.rowCount, 'rows affected');
      } catch (testErr) {
        // If test table doesn't exist, try to create it
        if ((testErr as any).code === '42P01') { // "undefined_table" PostgreSQL error
          try {
            console.log('Test table does not exist, creating it...');
            await db.query('CREATE TABLE IF NOT EXISTS url_scan_cache_test (url TEXT PRIMARY KEY, fetched_at TIMESTAMPTZ)');
            console.log('Test table created successfully');
          } catch (createErr) {
            console.error('Failed to create test table:', createErr);
          }
        } else {
          console.error('Test write failed:', testErr);
        }
      }
    }

    const query = `
      INSERT INTO url_scan_cache(
        url, verdict, score, explanation, details, vendor_results, 
        analysis_id, categories, reputation, last_analysis_date, 
        times_submitted, fetched_at, expires_at
      ) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
      ON CONFLICT (url) 
      DO UPDATE SET
        verdict = $2,
        score = $3,
        explanation = $4,
        details = $5,
        vendor_results = $6,
        analysis_id = $7,
        categories = $8,
        reputation = $9,
        last_analysis_date = $10,
        times_submitted = $11,
        fetched_at = NOW(),
        expires_at = $12
      RETURNING url
    `;

    const result2 = await db.query(query, values);
    console.log(`Cache save result: ${result2.rowCount} rows affected, URL: ${result.url}, expires: ${expiresAt}`);
    
    // Additional verification that our data was saved
    if (DEBUG_MODE) {
      const verifyResult = await db.query('SELECT url, verdict FROM url_scan_cache WHERE url = $1', [result.url]);
      if (verifyResult.rows.length > 0) {
        console.log('Verified cache entry exists:', verifyResult.rows[0]);
      } else {
        console.warn('Cache entry not found after save!');
      }
    }
  } catch (error) {
    console.error('Error details for cache save:', error);
    // Log specific PostgreSQL error codes that might be helpful
    if ((error as any).code) {
      console.error('PostgreSQL error code:', (error as any).code);
      
      // Check for common PostgreSQL error codes
      switch((error as any).code) {
        case '42P01': // undefined_table
          console.error('Table "url_scan_cache" does not exist. Make sure to run the SQL creation script.');
          break;
        case '28P01': // invalid_password
          console.error('Invalid database credentials.');
          break;
        case '3D000': // invalid_catalog_name
          console.error('Database does not exist.');
          break;
        case '08006': // connection_failure
        case '08001': // sqlclient_unable_to_establish_sqlconnection
        case '08004': // sqlserver_rejected_establishment_of_sqlconnection
          console.error('Failed to connect to the database server.');
          break;
        case '22P02': // invalid_text_representation
          console.error('Invalid data format for a column. Check data types.');
          break;
        case '23503': // foreign_key_violation
          console.error('Foreign key constraint violation.');
          break;
        default:
          console.error('Unhandled PostgreSQL error. See details above.');
      }
    }
  }
}

// Add a function to check for community feedback 
async function checkCommunityFeedback(url: string): Promise<{
  hasFeedback: boolean;
  majorityVerdict?: string;
  totalFeedbacks?: number;
  feedbackStats?: any[];
}> {
  try {
    const db = getPool();
    if (!db) {
      console.warn('Database connection not available, skipping feedback check');
      return { hasFeedback: false };
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
      
      console.log(`Found community feedback for ${url}: ${totalFeedbacks} total, majority: ${majorityVerdict}`);
      
      return {
        hasFeedback: true,
        majorityVerdict,
        totalFeedbacks,
        feedbackStats: statsResult.rows
      };
    }
    
    return { hasFeedback: false };
  } catch (error) {
    console.error('Error checking for community feedback:', error);
    return { hasFeedback: false };
  }
}

// Helper function to validate and normalize URL
function validateAndNormalizeUrl(inputUrl: string): { url: string | null; isLocalhost: boolean } {
  try {
    // Make sure URL has a protocol
    let urlToProcess = inputUrl.trim();
    if (!urlToProcess.startsWith('http://') && !urlToProcess.startsWith('https://')) {
      urlToProcess = 'https://' + urlToProcess;
    }
    
    // Validate URL format
    const urlObj = new URL(urlToProcess);
    
    // Check if it's a localhost URL
    const isLocalhost = urlObj.hostname === 'localhost' || 
                        urlObj.hostname === '127.0.0.1' || 
                        urlObj.hostname.endsWith('.local') ||
                        urlObj.hostname.endsWith('.test') ||
                        urlObj.hostname.endsWith('.localhost');
    
    // Make sure we have a valid hostname
    if (!urlObj.hostname) {
      return { url: null, isLocalhost: false };
    }
    
    // Basic normalization
    return { url: urlObj.toString(), isLocalhost };
  } catch (error) {
    console.error('URL validation error:', error);
    return { url: null, isLocalhost: false };
  }
}

// Modify the start of the POST handler to check database tables
export async function POST(request: Request) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    console.error('VIRUSTOTAL_API_KEY is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // Ensure database is set up correctly
  try {
    // Verify database connection and tables
    const dbReady = await ensureTablesExist();
    if (!dbReady) {
      console.warn('Database tables could not be verified. Will proceed without caching.');
    }
  } catch (dbError) {
    console.error('Error verifying database setup:', dbError);
    // Continue without failing the request
  }

  try {
    const { url: inputUrl } = await request.json();

    if (!inputUrl || typeof inputUrl !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate and normalize the URL
    const { url, isLocalhost } = validateAndNormalizeUrl(inputUrl);
    
    // If it's a localhost URL, return a safe result immediately
    if (isLocalhost && url) {
      console.log(`Local development URL detected: ${url} - Returning safe verdict without scanning`);
      return NextResponse.json({
        verdict: 'Safe',
        score: 0,
        url: url,
        explanation: "This is a localhost or local development URL, which is considered safe as it runs on your own machine.",
        details: [
          {
            category: "Local Development",
            status: 'ok',
            description: "This is a local URL that only you can access."
          }
        ],
        fromCache: false
      });
    }
    
    if (!url) {
      return NextResponse.json({ 
        error: 'Invalid URL format. Please enter a valid URL.',
        verdict: 'Error',
        score: 0,
        url: inputUrl,
        explanation: "The URL you entered could not be processed. Make sure it's a valid URL with a proper domain name."
      }, { status: 200 }); // Use 200 for better UX rather than 400
    }

    console.log(`Processing URL scan request: ${url}`);

    // 1. Check cache first
    const cachedResult = await getFromCache(url);
    if (cachedResult) {
      console.log(`Returning cached result for: ${url}`);
      return NextResponse.json(cachedResult);
    }

    // 2. Not in cache or expired, proceed with VirusTotal scan
    console.log(`No valid cache entry, scanning with VirusTotal: ${url}`);
    
    // Submit URL to VirusTotal for analysis
    const formData = new URLSearchParams();
    formData.append('url', url);

    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
            'x-apikey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: formData.toString(),
    });

    if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        console.error('VirusTotal URL submission failed:', submitResponse.status, errorData);
        return NextResponse.json({ error: `VirusTotal submission failed: ${errorData.error?.message || submitResponse.statusText}` }, { status: submitResponse.status });
    }

    const submitResult = await submitResponse.json();
    if (!submitResult || !submitResult.data || !submitResult.data.id) {
        console.error('VirusTotal submission response format unexpected:', submitResult);
        return NextResponse.json({ error: 'VirusTotal submission returned unexpected data' }, { status: 500 });
    }
    
    const analysisId = submitResult.data.id;
    console.log(`VirusTotal analysis ID: ${analysisId}`);

    // 3. Retrieve the analysis report (with attempt and fallback)
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for analysis

    let analysisResult: AnalysisResultType | null = null;

    console.log(`Attempt 1: Fetching analysis report: https://www.virustotal.com/api/v3/analyses/${analysisId}`);
    const reportResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
        method: 'GET',
        headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    });

    let needsFallback = false;
    let fallbackReason = '';

    if (reportResponse.ok) {
        const reportData = await reportResponse.json();
        console.log("Received Initial Analysis Report Data:", JSON.stringify(reportData, null, 2));

        if (reportData && reportData.data && reportData.data.attributes) {
            const status = reportData.data.attributes.status;
            if (status === 'completed') {
                // Analysis is complete, process directly
                console.log("Initial analysis completed.");
                analysisResult = processVirusTotalReport(url, reportData.data.attributes, analysisId);
            } else {
                // Analysis is queued or in another state, trigger fallback
                needsFallback = true;
                fallbackReason = `Initial analysis status was '${status}'.`;
                console.warn(fallbackReason);
            }
        } else {
            // Response format was unexpected, trigger fallback
             needsFallback = true;
             fallbackReason = "Initial analysis response format unexpected.";
             console.error(fallbackReason, reportData);
        }
    } else if (reportResponse.status === 404) {
        // Initial analysis not found, trigger fallback
        needsFallback = true;
        fallbackReason = `Initial analysis report ${analysisId} not found (404).`;
        console.warn(fallbackReason);
    } else {
        // Other HTTP error fetching initial report
        const errorText = await reportResponse.text();
        console.error('VirusTotal initial analysis report fetch failed:', reportResponse.status, errorText);
        let errorMessage = `VirusTotal analysis report fetch failed: ${reportResponse.statusText}`;
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = `VirusTotal analysis report fetch failed: ${errorData.error?.message || reportResponse.statusText}`;
        } catch (e) { /* ignore */ }
        // Do not proceed to fallback on general HTTP errors, return the error directly
        return NextResponse.json({ error: errorMessage }, { status: reportResponse.status });
    }

    // 4. Fallback: If needed, fetch the general URL report by SHA256
    if (needsFallback) {
        console.log(`Attempt 2 (Fallback): ${fallbackReason} Fetching general URL report.`);
        try {
            const urlIdentifier = crypto.createHash('sha256').update(url).digest('hex');
            console.log(`Calculated URL Identifier (SHA256): ${urlIdentifier}`);

            const urlReportUrl = `https://www.virustotal.com/api/v3/urls/${urlIdentifier}`;
            console.log(`Fetching fallback URL report: ${urlReportUrl}`);
            const urlReportResponse = await fetch(urlReportUrl, {
                method: 'GET',
                headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
            });

            if (!urlReportResponse.ok) {
                // Special handling for 404 - this means the URL is new to VirusTotal
                if (urlReportResponse.status === 404) {
                    console.log('URL is new to VirusTotal and still being analyzed.');
                    
                    // Create a "pending analysis" result that's accurate but user-friendly
                    analysisResult = {
                        verdict: 'Safe', // Default to safe for new URLs
                        score: 0,
                        url: url,
                        explanation: "This URL is new to VirusTotal and is currently being analyzed. Results will be more detailed on future scans.",
                        details: [
                            { 
                                category: "Analysis Status", 
                                status: 'warning', 
                                description: "URL has been submitted to VirusTotal and is awaiting full analysis." 
                            },
                            {
                                category: "Scan Status",
                                status: 'ok',
                                description: "No security threats have been detected so far."
                            }
                        ],
                        lastAnalysisDate: new Date().toISOString(), // Current time
                        timesSubmitted: 1, // First submission
                        // Don't store this preliminary result in the cache
                    };
                    
                    return NextResponse.json(analysisResult);
                }
                
                // Other error handling
                const errorText = await urlReportResponse.text();
                console.error('VirusTotal fallback URL report fetch failed:', urlReportResponse.status, errorText);
                let errorMessage = `VirusTotal fallback report fetch failed: ${urlReportResponse.statusText}`;
                 try {
                     const errorData = JSON.parse(errorText);
                     errorMessage = `VirusTotal fallback report fetch failed: ${errorData.error?.message || urlReportResponse.statusText}`;
                 } catch (e) { /* ignore */ }
                 
                return NextResponse.json({ 
                    error: errorMessage,
                    verdict: 'Error',
                    score: 0,
                    url: url,
                    explanation: "We were unable to retrieve analysis for this URL. It may be new to VirusTotal's database. Try scanning again in a few minutes.",
                }, { status: 200 }); // Return 200 instead of error status for better UX
            }

            // Successfully fetched fallback report
            const fallbackReportData = await urlReportResponse.json();
            console.log("Received Fallback URL Report Data:", JSON.stringify(fallbackReportData, null, 2));

            if (fallbackReportData && fallbackReportData.data && fallbackReportData.data.attributes) {
                // Process the fallback report data
                 analysisResult = processVirusTotalReport(url, fallbackReportData.data.attributes, urlIdentifier);
            } else {
                 console.error('VirusTotal fallback response format unexpected:', fallbackReportData);
                 // If fallback format is wrong, create an error result
                 analysisResult = {
                    verdict: 'Error',
                    score: 0,
                    url: url,
                    explanation: "Failed to process VirusTotal fallback report (unexpected format).",
                 };
            }
        } catch (fallbackError: any) {
             console.error('Error during fallback URL report fetch:', fallbackError);
              analysisResult = {
                 verdict: 'Error',
                 score: 0,
                 url: url,
                 explanation: `An error occurred during the fallback analysis check: ${fallbackError.message}`,
              };
        }
    }

    // 5. Save successful results to cache and return them
    if (analysisResult && analysisResult.verdict !== 'Error') {
        // Mark as not from cache (this is a fresh result)
        analysisResult.fromCache = false;
        
        console.log('About to save result to cache for URL:', url);
        
        // Save to cache, but wait for completion to catch any errors
        try {
            await saveToCache(analysisResult);
            console.log('Successfully saved to cache');
        } catch (cacheError) {
            console.error('Failed to save to cache:', cacheError);
        }
    }
    
    // 5. Check for community feedback
    if (analysisResult) {
      const feedback = await checkCommunityFeedback(url);
      
      // Add feedback information to the result
      if (feedback.hasFeedback) {
        analysisResult.communityFeedback = {
          hasFeedback: true,
          majorityVerdict: feedback.majorityVerdict,
          totalFeedbacks: feedback.totalFeedbacks,
          feedbackStats: feedback.feedbackStats
        };
        
        // If there's significant community feedback disagreeing with the original verdict,
        // add a warning to the explanation
        if (feedback.majorityVerdict !== analysisResult.verdict && 
            feedback.totalFeedbacks && feedback.totalFeedbacks >= 3) {
          analysisResult.explanation += ` Note: Community users (${feedback.totalFeedbacks}) have suggested this URL is "${feedback.majorityVerdict}" instead.`;
        }
      } else {
        // No feedback yet
        analysisResult.communityFeedback = { hasFeedback: false };
      }
    }
    
    // 6. Return the final result (either from initial analysis or fallback)
    if (analysisResult) {
        return NextResponse.json(analysisResult);
    } else {
        // Should not happen if logic is correct, but as a safeguard:
        console.error("Analysis result was unexpectedly null after processing.");
        return NextResponse.json({ error: "Failed to obtain analysis result after processing." }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error scanning URL:', error);
    // Avoid leaking sensitive error details
    let errorMessage = 'Failed to scan URL';
     if (error.message) {
         errorMessage += `: ${error.message}`;
     }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Helper function to process the VirusTotal analysis attributes
function processVirusTotalReport(url: string, attributes: any, idForLink: string): AnalysisResultType {
    console.log("Processing VirusTotal Attributes:", JSON.stringify(attributes, null, 2));

    // Basic stats and results (supporting both analysis and url report formats)
    const stats = attributes.last_analysis_stats || attributes.stats || {};
    const results = attributes.last_analysis_results || attributes.results || {};

    // Additional data from either attribute set
    const categories = attributes.categories || {};
    const reputation = attributes.reputation || 0;
    const lastAnalysisDate = attributes.last_analysis_date 
      ? new Date(attributes.last_analysis_date * 1000).toISOString() // Convert Unix timestamp to ISO string
      : null;
    const timesSubmitted = attributes.times_submitted || 0;

    console.log("Stats used:", JSON.stringify(stats, null, 2));
    console.log("Number of results entries:", Object.keys(results).length);
    console.log("Categories:", JSON.stringify(categories, null, 2));
    console.log("Reputation:", reputation);
    console.log("Last Analysis Date:", lastAnalysisDate);
    console.log("Times Submitted:", timesSubmitted);

    // Calculate verdict and score
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const harmlessCount = stats.harmless || 0;
    const undetectedCount = stats.undetected || 0;
    
    // Calculate total scanners
    const totalScanners = (stats.hasOwnProperty('malicious') ? maliciousCount : 0) +
                          (stats.hasOwnProperty('suspicious') ? suspiciousCount : 0) +
                          (stats.hasOwnProperty('harmless') ? harmlessCount : 0) +
                          (stats.hasOwnProperty('undetected') ? undetectedCount : 0);

    console.log(`Counts - Malicious: ${maliciousCount}, Suspicious: ${suspiciousCount}, Harmless: ${harmlessCount}, Undetected: ${undetectedCount}, Total: ${totalScanners}`);

    // Determine verdict, score, and explanation
    let verdict: AnalysisResultType['verdict'] = 'Safe';
    let score = 0; // Risk score: 0 (safe) to 1 (malicious)
    let explanation = "URL appears safe based on VirusTotal analysis.";

    // Basic check for "no data" condition
    const analysisStatus = attributes.status; // Only present in analysis reports
    const hasRecentData = attributes.last_analysis_date || attributes.last_submission_date || Object.keys(results).length > 0;

    if (totalScanners === 0 && !hasRecentData && analysisStatus !== 'completed') {
        verdict = 'Error';
        score = 0;
        explanation = "VirusTotal has no analysis data for this URL, or the analysis is still in progress.";
        console.warn("No significant scanner results or date info found for URL:", url);
    } else if (maliciousCount > 0) {
        verdict = 'Malicious';
        score = totalScanners > 0 ? Math.min(1, (maliciousCount * 1.0 + suspiciousCount * 0.5) / totalScanners) : 1.0;
        explanation = `Detected as potentially malicious by ${maliciousCount} out of ${totalScanners} security vendors.`;
    } else if (suspiciousCount > 0) {
        verdict = 'Suspicious';
        score = totalScanners > 0 ? Math.min(1, (suspiciousCount * 0.5) / totalScanners) : 0.5;
        explanation = `Detected as potentially suspicious by ${suspiciousCount} out of ${totalScanners} security vendors. Exercise caution.`;
    } else if ((harmlessCount > 0 || undetectedCount > 0) && totalScanners > 0) {
        verdict = 'Safe';
        score = 0;
        explanation = `Considered safe by the majority (${harmlessCount + undetectedCount}/${totalScanners}) of security vendors.`;
    } else if (totalScanners === 0 && hasRecentData) {
        verdict = 'Safe';
        score = 0;
        explanation = `VirusTotal analysis did not find malicious or suspicious content (${totalScanners} detections reported).`;
        console.log("Treating as Safe due to zero detections but recent data/known URL:", url);
    } else {
        verdict = 'Suspicious';
        score = 0.1;
        explanation = `Analysis inconclusive (${maliciousCount} malicious, ${suspiciousCount} suspicious, ${harmlessCount} harmless, ${undetectedCount} undetected). Review full report.`;
        console.warn("Inconclusive analysis stats for URL:", url, JSON.stringify(stats));
    }

    // Clamp score between 0 and 1
    score = Math.max(0, Math.min(1, score));
    console.log(`Final Verdict: ${verdict}, Score: ${score}`);

    // Process vendor results
    const vendorResults: Record<string, string> = {};
    for (const vendor in results) {
        vendorResults[vendor] = results[vendor].result; // e.g., "clean", "malicious", "phishing", "suspicious"
    }

    // Extract categories (different formats in different response types)
    const categoryArray = Object.keys(categories);

    // Create details array
    const safeTotalScanners = totalScanners > 0 ? totalScanners : 'N/A';
    const details = [
        { category: "Malicious Detections", status: maliciousCount > 0 ? 'critical' : 'ok', description: `${maliciousCount}/${safeTotalScanners} vendors flagged as malicious.` },
        { category: "Suspicious Detections", status: suspiciousCount > 0 ? 'warning' : 'ok', description: `${suspiciousCount}/${safeTotalScanners} vendors flagged as suspicious.` },
    ];

    // For non-empty category list, add to details
    if (categoryArray.length > 0) {
        details.push({ 
            category: "URL Categories", 
            status: 'ok', 
            description: `Categorized as: ${categoryArray.join(', ')}` 
        });
    }

    // If reputation is available, add to details
    if (reputation !== undefined && reputation !== null) {
        details.push({ 
            category: "URL Reputation", 
            status: reputation < 0 ? 'warning' : 'ok', 
            description: `Reputation score: ${reputation}` 
        });
    }

    // Clean up analysisId
    let displayAnalysisId = idForLink;
    if (idForLink?.startsWith('u-') && idForLink.includes('-')) {
        displayAnalysisId = idForLink.split('-')[1];
    }

    // Return the complete result
    return {
        verdict,
        score,
        url,
        explanation,
        details,
        vendorResults,
        analysisId: displayAnalysisId,
        categories: categoryArray,
        reputation: reputation,
        lastAnalysisDate: lastAnalysisDate,
        timesSubmitted: timesSubmitted
    };
} 