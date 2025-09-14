/**
 * Authentication utilities for lib
 * Contains helper functions for authentication
 */

/**
 * Detect user role based on email
 */
export function detectUserRole(email: string): 'recruiter' | 'candidate' {
  // Simple heuristic: if email contains 'recruiter', 'hr', 'hiring', or common company domains
  const recruiterKeywords = ['recruiter', 'hr', 'hiring', 'talent', 'people'];
  const emailLower = email.toLowerCase();
  
  // Check for recruiter keywords
  if (recruiterKeywords.some(keyword => emailLower.includes(keyword))) {
    return 'recruiter';
  }
  
  // Check for common company email patterns (not gmail, yahoo, etc.)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && !personalDomains.includes(domain)) {
    return 'recruiter'; // Assume company email = recruiter
  }
  
  return 'candidate'; // Default to candidate
}
