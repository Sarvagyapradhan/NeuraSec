# URL Analysis with Homograph Attack Detection

This module provides functionality for analyzing URLs for security risks, including homograph attack detection.

## What are Homograph Attacks?

Homograph attacks use visually similar characters to create lookalike domains that impersonate legitimate websites. For example:

- Using `раypal.com` (with a Cyrillic 'р') instead of `paypal.com` (with a Latin 'p')
- Using `аpple.com` (with a Cyrillic 'а') instead of `apple.com` (with a Latin 'a')

These attacks are particularly dangerous because the domains look nearly identical to human eyes but actually lead to different servers controlled by attackers.

## Features

The homograph detection system in this module includes:

1. **Confusable Character Detection**: Identifies characters that look similar to standard Latin characters but come from different Unicode blocks.

2. **Punycode Detection**: Identifies IDN (Internationalized Domain Name) Punycode-encoded domains that might hide similar-looking characters.

3. **Mixed Script Detection**: Detects domains that mix characters from different writing systems (e.g., Latin and Cyrillic).

4. **Levenshtein Distance Comparison**: Measures the edit distance between domains and known trusted domains to detect slight variations.

5. **Domain Similarity Analysis**: Provides contextual information about which legitimate domain a suspicious domain might be trying to mimic.

## Usage

### Basic URL Analysis

```typescript
import { analyzeUrl } from './route';

// Analyze a URL
const result = await analyzeUrl('https://example.com');
console.log(result.verdict); // 'Safe', 'Risky', or 'Dangerous'
console.log(result.suspicious_features); // List of detected issues
```

### Testing Homograph Detection Only

```typescript
import { detectHomographAttack } from './homograph';

// Test a specific domain against trusted domains
const trustedDomains = ['google.com', 'facebook.com', 'paypal.com'];
const result = detectHomographAttack('раypal.com', trustedDomains);

console.log(result.isPotentialHomograph); // true
console.log(result.reasons); // List of reasons why it's suspicious
console.log(result.similarTo); // 'paypal.com' (the domain it's mimicking)
```

## Testing

You can run the test suite for homograph detection using:

```bash
npx ts-node src/app/api/analyze-url/test-homograph.ts
```

This will run a series of test cases against the detection system and output the results.

## Response Format

The API returns results in the following format:

```typescript
{
  url: string;              // The analyzed URL
  verdict: 'Safe' | 'Risky' | 'Dangerous';  // Overall safety assessment
  score: number;            // Safety score (0-1, higher is safer)
  sources: {                // Detection sources
    virusTotal?: boolean;   // VirusTotal detection
    alienVaultOTX?: boolean; // AlienVault OTX detection
    homographDetection?: boolean; // Homograph attack detection
  };
  domain_age_days: number | null;  // Domain age in days (if available)
  ssl_valid: boolean | null;       // SSL validation status
  suspicious_features: string[];   // List of detected suspicious features
  suggestions: string;             // Security recommendations
}
```

## Implementation Details

The homograph detection is implemented in `homograph.ts` and integrated into the URL analysis API in `route.ts`. The system maintains a mapping of confusable characters to their ASCII equivalents and uses various detection techniques to identify potential attacks. 