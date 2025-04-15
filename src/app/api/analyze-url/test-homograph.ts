/**
 * Test file for homograph detection functions
 * Run with: npx ts-node src/app/api/analyze-url/test-homograph.ts
 */

import { detectHomographAttack, normalizeConfusables, hasMixedScript, isPunycodeDomain } from './homograph';

// List of trusted domains for testing
const TRUSTED_DOMAINS = [
  'google.com', 
  'facebook.com',
  'microsoft.com',
  'apple.com',
  'paypal.com',
  'amazon.com',
  'netflix.com',
  'github.com'
];

// Test homograph detection with various examples
const testCases = [
  // Normal legitimate domains
  { domain: 'google.com', expectHomograph: false, description: 'Legitimate domain' },
  { domain: 'subdomain.microsoft.com', expectHomograph: false, description: 'Legitimate subdomain' },
  
  // Typosquatting examples (not homographs but similar)
  { domain: 'gooogle.com', expectHomograph: true, description: 'Typosquatting with extra letter' },
  { domain: 'mircosoft.com', expectHomograph: true, description: 'Typosquatting with transposed letters' },
  
  // Homograph attacks with Cyrillic characters
  { domain: 'раypal.com', expectHomograph: true, description: 'Cyrillic "р" instead of Latin "p"' },
  { domain: 'аpple.com', expectHomograph: true, description: 'Cyrillic "а" instead of Latin "a"' },
  { domain: 'amаzon.com', expectHomograph: true, description: 'Cyrillic "а" in the middle' },
  
  // Mixed script attacks
  { domain: 'microsоft.com', expectHomograph: true, description: 'Mixed Latin and Cyrillic' },
  
  // Punycode examples
  { domain: 'xn--pypal-4ve.com', expectHomograph: true, description: 'Punycode domain' },
  
  // Number substitutions
  { domain: 'g00gle.com', expectHomograph: true, description: 'Numbers instead of letters' },
  
  // Complex example
  { domain: 'раypаl-secure.com', expectHomograph: true, description: 'Multiple Cyrillic characters' },
];

// Run tests
console.log('======= HOMOGRAPH DETECTION TESTS =======\n');

testCases.forEach((test, index) => {
  console.log(`Test #${index + 1}: ${test.domain} - ${test.description}`);
  
  // Test basic functions
  console.log(`  • isPunycodeDomain: ${isPunycodeDomain(test.domain)}`);
  console.log(`  • hasMixedScript: ${hasMixedScript(test.domain)}`);
  console.log(`  • normalizeConfusables: ${normalizeConfusables(test.domain)}`);
  
  // Test comprehensive detection
  const result = detectHomographAttack(test.domain, TRUSTED_DOMAINS);
  console.log(`  • isPotentialHomograph: ${result.isPotentialHomograph} (expected: ${test.expectHomograph})`);
  
  if (result.isPotentialHomograph) {
    console.log('  • Detection reasons:');
    result.reasons.forEach(reason => console.log(`    - ${reason}`));
    
    if (result.similarTo) {
      console.log(`  • Similar to: ${result.similarTo}`);
    }
  }
  
  // Validation
  if (result.isPotentialHomograph === test.expectHomograph) {
    console.log('  ✅ TEST PASSED');
  } else {
    console.log('  ❌ TEST FAILED');
  }
  
  console.log(''); // Empty line for readability
});

console.log('======= TEST SUMMARY =======');
const passedCount = testCases.filter(test => 
  detectHomographAttack(test.domain, TRUSTED_DOMAINS).isPotentialHomograph === test.expectHomograph
).length;

console.log(`Passed: ${passedCount}/${testCases.length}`);
console.log(`Success rate: ${((passedCount / testCases.length) * 100).toFixed(2)}%`); 