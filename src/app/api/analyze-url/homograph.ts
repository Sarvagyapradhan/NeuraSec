/**
 * Utility functions for detecting homograph attacks
 * 
 * Homograph attacks use visually similar characters to create lookalike domains
 * For example: "рaypal.com" (using Cyrillic 'р' that looks like Latin 'p')
 */

import { Levenshtein } from './levenshtein';

// Map of visually similar characters to their ASCII equivalent
// This is not exhaustive but covers common confusables
const CONFUSABLE_MAP: Record<string, string> = {
  'а': 'a', // Cyrillic 'а' to Latin 'a'
  'е': 'e', // Cyrillic 'е' to Latin 'e'
  'о': 'o', // Cyrillic 'о' to Latin 'o'
  'р': 'p', // Cyrillic 'р' to Latin 'p'
  'с': 'c', // Cyrillic 'с' to Latin 'c'
  'ѕ': 's', // Cyrillic 'ѕ' to Latin 's'
  'і': 'i', // Cyrillic 'і' to Latin 'i'
  'ј': 'j', // Cyrillic 'ј' to Latin 'j'
  'ԛ': 'q', // Cyrillic 'ԛ' to Latin 'q'
  'у': 'y', // Cyrillic 'у' to Latin 'y'
  'х': 'x', // Cyrillic 'х' to Latin 'x'
  'ꙍ': 'w', // Cyrillic 'ꙍ' to Latin 'w'
  'ⅿ': 'm', // Roman numeral 'ⅿ' to Latin 'm'
  'ｎ': 'n', // Fullwidth 'ｎ' to Latin 'n'
  'ɡ': 'g', // Latin small script g to Latin 'g'
  'ӏ': 'l', // Cyrillic 'ӏ' to Latin 'l'
  '1': 'l', // Number '1' to Latin 'l'
  '0': 'o', // Number '0' to Latin 'o'
  '𝟏': '1', // Mathematical '𝟏' to '1'
  '𝟐': '2', // Mathematical '𝟐' to '2'
  '𝟑': '3', // Mathematical '𝟑' to '3'
  '𝟎': '0', // Mathematical '𝟎' to '0'
  'ḋ': 'd', // Latin 'd with dot above' to 'd'
  'ṫ': 't', // Latin 't with dot above' to 't'
  'ċ': 'c', // Latin 'c with dot above' to 'c'
  'ḃ': 'b', // Latin 'b with dot above' to 'b'
  // Add more confusables as needed
};

/**
 * Check if a domain is an IDN (Internationalized Domain Name) using Punycode
 * @param domain Domain to check
 * @returns Whether the domain is an IDN
 */
export function isPunycodeDomain(domain: string): boolean {
  return domain.toLowerCase().includes('xn--');
}

/**
 * Normalize a domain by replacing confusable characters with their ASCII equivalents
 * @param domain Domain to normalize
 * @returns Normalized domain
 */
export function normalizeConfusables(domain: string): string {
  return Array.from(domain).map(char => 
    CONFUSABLE_MAP[char] || char
  ).join('');
}

/**
 * Check if a domain has mixed script (characters from different writing systems)
 * This is a simple check - a more comprehensive version would use Unicode blocks
 * @param domain Domain to check
 * @returns Whether the domain has mixed script
 */
export function hasMixedScript(domain: string): boolean {
  // A basic check for Latin + Cyrillic mix (most common in homograph attacks)
  const latinPattern = /[a-z]/i;
  const cyrillicPattern = /[\u0400-\u04FF]/i;
  
  return latinPattern.test(domain) && cyrillicPattern.test(domain);
}

/**
 * Check for visually similar domains against a list of trusted domains
 * @param domain Domain to check
 * @param trustedDomains List of trusted domains
 * @returns Object with similarity info if found, null otherwise
 */
export function checkDomainSimilarity(
  domain: string, 
  trustedDomains: string[]
): { similarTo: string; distance: number } | null {
  // Normalize the domain by converting confusables to ASCII
  const normalizedDomain = normalizeConfusables(domain.toLowerCase());
  
  // Remove 'www.' prefix if present for comparison
  const domainWithoutWWW = normalizedDomain.replace(/^www\./, '');
  
  let mostSimilar: string | null = null;
  let minDistance = Infinity;
  
  // Find the most similar trusted domain using Levenshtein distance
  for (const trustedDomain of trustedDomains) {
    const normalizedTrusted = trustedDomain.toLowerCase().replace(/^www\./, '');
    const distance = Levenshtein(domainWithoutWWW, normalizedTrusted);
    
    // Consider similar if the edit distance is small relative to domain length
    // For short domains, even 1-2 character differences could be significant
    const threshold = Math.min(3, Math.floor(normalizedTrusted.length * 0.2));
    
    if (distance <= threshold && distance < minDistance) {
      minDistance = distance;
      mostSimilar = trustedDomain;
    }
  }
  
  if (mostSimilar) {
    return { similarTo: mostSimilar, distance: minDistance };
  }
  
  return null;
}

/**
 * Comprehensive homograph detection for a domain
 * @param domain Domain to check
 * @param trustedDomains List of trusted domains
 * @returns Detection results
 */
export function detectHomographAttack(
  domain: string, 
  trustedDomains: string[]
): { 
  isPotentialHomograph: boolean; 
  reasons: string[];
  similarTo?: string;
} {
  const reasons: string[] = [];
  let similarTo: string | undefined;
  
  // Check for IDN/Punycode
  if (isPunycodeDomain(domain)) {
    reasons.push('Domain uses Punycode encoding (xn--), which may hide visually similar characters');
  }
  
  // Check for mixed script
  if (hasMixedScript(domain)) {
    reasons.push('Domain mixes characters from different writing systems (e.g., Latin + Cyrillic)');
  }
  
  // Check for similar domains using normalized comparison
  const similarity = checkDomainSimilarity(domain, trustedDomains);
  if (similarity) {
    reasons.push(`Domain is visually similar to trusted domain: ${similarity.similarTo} (edit distance: ${similarity.distance})`);
    similarTo = similarity.similarTo;
  }
  
  // Domain has confusable characters?
  const normalized = normalizeConfusables(domain);
  if (normalized !== domain) {
    reasons.push('Domain contains characters that look similar to standard Latin characters');
  }
  
  return {
    isPotentialHomograph: reasons.length > 0,
    reasons,
    similarTo
  };
} 