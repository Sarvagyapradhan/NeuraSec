// ... existing code ...
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { detectHomographAttack } from './homograph';

// API Keys from environment variables
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const OTX_API_KEY = process.env.OTX_API_KEY;

// Log available API keys (without showing the actual keys)
console.log("[API] VirusTotal API Key available:", !!VIRUSTOTAL_API_KEY);
console.log("[API] OTX API Key available:", !!OTX_API_KEY);

console.log("[API] Initializing URL analyzer API");

// List of trusted domains that should be considered safe
const TRUSTED_DOMAINS = [
  // Search engines
  'google.com', 'www.google.com',
  'bing.com', 'www.bing.com',
  'yahoo.com', 'www.yahoo.com',
  'duckduckgo.com', 'www.duckduckgo.com',
  
  // Social media & content
  'facebook.com', 'www.facebook.com',
  'twitter.com', 'www.twitter.com',
  'instagram.com', 'www.instagram.com',
  'linkedin.com', 'www.linkedin.com',
  'youtube.com', 'www.youtube.com',
  'reddit.com', 'www.reddit.com',
  'pinterest.com', 'www.pinterest.com',
  
  // Tech companies
  'microsoft.com', 'www.microsoft.com',
  'apple.com', 'www.apple.com',
  'amazon.com', 'www.amazon.com',
  'netflix.com', 'www.netflix.com',
  'openai.com', 'www.openai.com',
  'chatgpt.com', 'www.chatgpt.com',
  
  // Other common services
  'github.com', 'www.github.com',
  'stackoverflow.com', 'www.stackoverflow.com',
  'medium.com', 'www.medium.com',
  'wikipedia.org', 'www.wikipedia.org',
  'outlook.com', 'www.outlook.com',
  'gmail.com', 'www.gmail.com',
  'paypal.com', 'www.paypal.com',
  'dropbox.com', 'www.dropbox.com',
  'zoom.us', 'www.zoom.us',
  'slack.com', 'www.slack.com',
  'github.io',
  'vercel.app',
  'cloudflare.com', 'www.cloudflare.com',
  'shopify.com', 'www.shopify.com',
  'wordpress.com', 'www.wordpress.com',
  'ebay.com', 'www.ebay.com'
];

console.log("[API] Trusted domains configured:", TRUSTED_DOMAINS.length);

// Helper function to check if a URL is from a trusted domain
function isUrlFromTrustedDomain(parsedUrl: URL): boolean {
  // Get the hostname and remove 'www.' if present
  const normalizedHostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  
  // Direct match (with or without www)
  if (TRUSTED_DOMAINS.includes(parsedUrl.hostname) || 
      TRUSTED_DOMAINS.includes(normalizedHostname)) {
    console.log(`[API] Direct match for trusted domain: ${parsedUrl.hostname}`);
    return true;
  }
  
  // Check for subdomain of trusted domain
  for (const domain of TRUSTED_DOMAINS) {
    const normalizedDomain = domain.toLowerCase().replace(/^www\./, '');
    if (normalizedHostname === normalizedDomain || 
        normalizedHostname.endsWith(`.${normalizedDomain}`)) {
      console.log(`[API] Subdomain match for trusted domain: ${normalizedHostname} matches ${normalizedDomain}`);
      return true;
    }
  }
  
  return false;
}

// Check VirusTotal API for URL threats
async function checkVirusTotal(url: string): Promise<{detected: boolean, detections?: number, total?: number}> {
  if (!VIRUSTOTAL_API_KEY) {
    console.log("[VirusTotal] API key not available, skipping check");
    return { detected: false };
  }
  
  try {
    console.log("[VirusTotal] Checking URL:", url);
    
    // URL needs to be base64 encoded for the API
    const encodedUrl = Buffer.from(url).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // First check if the URL has been analyzed before
    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${encodedUrl}`,
      {
        headers: {
          "x-apikey": VIRUSTOTAL_API_KEY
        },
        timeout: 10000
      }
    );
    
    console.log("[VirusTotal] Response received");
    
    if (response.data && response.data.data && response.data.data.attributes) {
      const stats = response.data.data.attributes.last_analysis_stats;
      if (stats) {
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const total = stats.harmless + stats.malicious + stats.suspicious + stats.undetected;
        
        console.log(`[VirusTotal] Results - Malicious: ${malicious}, Suspicious: ${suspicious}, Total: ${total}`);
        return { 
          detected: (malicious + suspicious) > 0, 
          detections: malicious + suspicious,
          total
        };
      }
    }
    
    return { detected: false };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
      console.log("[VirusTotal] URL not found in database, submitting for analysis");
      try {
        // Submit URL for analysis
        await axios.post(
          'https://www.virustotal.com/api/v3/urls',
          `url=${encodeURIComponent(url)}`,
          {
            headers: {
              'x-apikey': VIRUSTOTAL_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );
        console.log("[VirusTotal] URL submitted for analysis");
      } catch (submitError) {
        console.error("[VirusTotal] Error submitting URL:", submitError);
      }
    } else {
      console.error("[VirusTotal] API check error:", error);
    }
    return { detected: false };
  }
}

// Check AlienVault OTX for domain reputation
async function checkOTX(domain: string): Promise<{detected: boolean, pulseCount?: number}> {
  if (!OTX_API_KEY) {
    console.log("[OTX] API key not available, skipping check");
    return { detected: false };
  }
  
  try {
    console.log("[OTX] Checking domain:", domain);
    
    const response = await axios.get(
      `https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`,
      {
        headers: {
          'X-OTX-API-KEY': OTX_API_KEY
        },
        timeout: 10000
      }
    );
    
    console.log("[OTX] Response received");
    
    if (response.data && response.data.pulse_info) {
      const pulseCount = response.data.pulse_info.count || 0;
      console.log(`[OTX] Pulse count: ${pulseCount}`);
      return { 
        detected: pulseCount > 0,
        pulseCount
      };
    }
    
    return { detected: false };
  } catch (error) {
    console.error("[OTX] API check error:", error);
    return { detected: false };
  }
}

// New implementation of analyzeUrlLogic that uses actual API calls
async function analyzeUrlLogic(url: string) {
  console.log("[analyzeUrlLogic] Starting analysis for:", url);
  
  // Extract domain from URL
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  
  // Initialize results
  const sources: {[key: string]: boolean} = {};
  const suspiciousFeatures: string[] = [];
  
  // Check for homograph attack patterns
  const homographResult = detectHomographAttack(domain, TRUSTED_DOMAINS);
  if (homographResult.isPotentialHomograph) {
    console.log("[analyzeUrlLogic] Potential homograph attack detected:", homographResult.reasons);
    homographResult.reasons.forEach(reason => {
      suspiciousFeatures.push(reason);
    });
    
    if (homographResult.similarTo) {
      suspiciousFeatures.push(`This domain appears to mimic: ${homographResult.similarTo}`);
      // Add significant risk score for homograph attacks that mimic trusted domains
      sources.homographDetection = true;
    }
  }
  
  // Check VirusTotal
  const vtResult = await checkVirusTotal(url);
  sources.virusTotal = vtResult.detected;
  if (vtResult.detected && vtResult.detections) {
    suspiciousFeatures.push(`Detected as malicious by ${vtResult.detections} security vendors on VirusTotal`);
  }
  
  // Check OTX
  const otxResult = await checkOTX(domain);
  sources.alienVaultOTX = otxResult.detected;
  if (otxResult.detected && otxResult.pulseCount) {
    suspiciousFeatures.push(`Found in ${otxResult.pulseCount} threat reports on AlienVault OTX`);
  }
  
  // Check URL for suspicious patterns
  if (url.includes('login') || url.includes('signin') || url.includes('account')) {
    if (parsedUrl.pathname.length > 30) {
      suspiciousFeatures.push('Login/account page with unusually long URL path');
    }
  }
  
  if (parsedUrl.search && parsedUrl.search.length > 50) {
    suspiciousFeatures.push('URL contains unusually long query parameters');
  }
  
  if (/[0-9a-f]{32}/.test(url) || /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(url)) {
    suspiciousFeatures.push('URL contains hash-like strings which can be used to evade detection');
  }
  
  // Check if domain has numbers and letters mixed in unusual ways
  if (/\d+[a-z]+\d+[a-z]+\d+/i.test(domain)) {
    suspiciousFeatures.push('Domain name contains unusual number-letter patterns');
  }
  
  // Calculate risk score (0 to 1, higher is riskier)
  // Base the score on concrete factors rather than randomization
  let score = 0;
  
  // Major factors (API detections)
  if (sources.virusTotal) score += 0.4;
  if (sources.alienVaultOTX) score += 0.4;
  
  // Homograph attacks are very high risk
  if (sources.homographDetection) score += 0.6;
  
  // Minor factors (suspicious patterns)
  score += suspiciousFeatures.length * 0.05;
  
  // Clamp score between 0 and 1
  score = Math.max(0, Math.min(1, score));
  
  // Determine verdict based on score
  let verdict: 'Safe' | 'Risky' | 'Dangerous';
  let suggestions = '';
  
  if (score < 0.2) {
    verdict = 'Safe';
    suggestions = 'This URL appears to be safe based on our analysis.';
  } else if (score < 0.6) {
    verdict = 'Risky';
    suggestions = 'Exercise caution when visiting this URL. Consider checking its legitimacy before entering sensitive information.';
  } else {
    verdict = 'Dangerous';
    suggestions = 'This URL appears to be dangerous. We strongly advise against visiting it as it may pose security risks.';
  }
  
  // Add specific homograph warning to suggestions if detected
  if (homographResult.isPotentialHomograph && homographResult.similarTo) {
    suggestions = `WARNING: This URL appears to be impersonating ${homographResult.similarTo}. ` + suggestions;
  }
  
  // Final result
  return {
    url,
    verdict,
    score: 1 - score, // Invert so higher means safer
    sources,
    domain_age_days: null, // We could implement actual WHOIS lookup here
    ssl_valid: parsedUrl.protocol === 'https:',
    suspicious_features: suspiciousFeatures,
    suggestions
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
    }

    // Validate URL format and structure
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      
      // Check if URL has a valid hostname
      if (!parsedUrl.hostname || parsedUrl.hostname.length < 3) {
        return NextResponse.json({ 
          error: 'Invalid URL: hostname is too short or missing' 
        }, { status: 400 });
      }
      
      // Check if URL has a valid protocol
      if (!parsedUrl.protocol.match(/^https?:$/)) {
        return NextResponse.json({ 
          error: 'Invalid URL: protocol must be http or https' 
        }, { status: 400 });
      }
      
      // Check if URL has a valid domain name structure (must have at least one dot and a valid TLD)
      const domainParts = parsedUrl.hostname.split('.');
      if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
        return NextResponse.json({ 
          error: 'Invalid URL: domain name must include a valid TLD (e.g., .com, .org)' 
        }, { status: 400 });
      }
      
      // Modified character validation to allow for IDN/Unicode domains
      // Only enforce standard domain rules for non-IDN domains
      if (!parsedUrl.hostname.includes('xn--')) {
        const validDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!validDomainRegex.test(parsedUrl.hostname)) {
          // Instead of rejecting, we'll proceed but mark it for homograph checking
          console.log("[API] Domain contains non-standard characters, checking for homograph attack:", parsedUrl.hostname);
        }
      }
      
    } catch (error) {
      console.error("[API] URL validation error:", error);
      return NextResponse.json({ 
        error: 'Invalid URL format. Please enter a valid web address (e.g., https://example.com)' 
      }, { status: 400 });
    }

    console.log("[API] Received request to analyze:", url);
    
    // First check for homograph attacks
    const homographResult = detectHomographAttack(parsedUrl.hostname, TRUSTED_DOMAINS);
    
    // If the domain was detected as an impersonation of a trusted domain, handle it specifically
    if (homographResult.isPotentialHomograph && homographResult.similarTo) {
      console.log("[API] Homograph attack detected, mimicking:", homographResult.similarTo);
      
      const attackResult = {
        url: url,
        verdict: 'Dangerous',
        score: 0.1, // Very low safety score
        sources: { homographDetection: true },
        domain_age_days: null,
        ssl_valid: parsedUrl.protocol === 'https:',
        suspicious_features: homographResult.reasons,
        suggestions: `WARNING: This URL appears to be impersonating ${homographResult.similarTo}. ` +
                    `It uses characters that look similar to trick you. This is a common phishing technique.`
      };
      
      return NextResponse.json(attackResult);
    }
    
    // If not a homograph attack, check if it's a trusted domain
    if (isUrlFromTrustedDomain(parsedUrl)) {
      console.log("[API] URL is from a trusted domain:", parsedUrl.hostname);
      
      // For known safe domains, return a consistent high safety result
      const safeResult = {
        url: url,
        verdict: 'Safe',
        score: 0.95, // 95% safe score for trusted domains
        sources: {},
        domain_age_days: 365, // Placeholder value
        ssl_valid: true,
        suspicious_features: [],
        suggestions: "This domain is in our trusted domains list."
      };
      
      return NextResponse.json(safeResult);
    }
    
    // For all other URLs, perform the full analysis
    console.log("[API] Performing full analysis for:", url);
    const analysisData = await analyzeUrlLogic(url);
    console.log("[API] Analysis complete for:", url);
    
    return NextResponse.json(analysisData);

  } catch (error) {
    console.error("[API] Error during URL analysis:", error);
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 
// ... existing code ...