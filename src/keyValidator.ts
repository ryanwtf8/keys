export interface KeyValidationResult {
  isValid: boolean;
  format?: 'hex64' | 'hex16' | 'base64' | 'unknown';
  cleanedKey?: string;
  error?: string;
}

export function validateKey(key: string, expectedFormat?: string): KeyValidationResult {
  if (!key || key.length === 0) {
    return { isValid: false, error: 'Empty key' };
  }

  const trimmedKey = key.trim();

  const patterns = {
    hex64: /^[0-9a-f]{64}$/i,
    hex16: /^[0-9a-f]{16}$/i,
    hex32: /^[0-9a-f]{32}$/i,
    base64: /^[A-Za-z0-9+/]{30,50}={0,2}$/,
  };


  if (patterns.hex64.test(trimmedKey)) {
    return { isValid: true, format: 'hex64', cleanedKey: trimmedKey.toLowerCase() };
  }
  
  if (patterns.hex16.test(trimmedKey)) {
    return { isValid: true, format: 'hex16', cleanedKey: trimmedKey.toLowerCase() };
  }

  if (patterns.hex32.test(trimmedKey)) {
    return { isValid: true, format: 'hex16', cleanedKey: trimmedKey.toLowerCase() };
  }

  if (patterns.base64.test(trimmedKey)) {
    return { isValid: true, format: 'base64', cleanedKey: trimmedKey };
  }

  const cleaned = trimmedKey
    .replace(/[^A-Za-z0-9+/=]/g, '')
    .trim();

  if (patterns.hex64.test(cleaned)) {
    return { isValid: true, format: 'hex64', cleanedKey: cleaned.toLowerCase() };
  }
  if (patterns.hex16.test(cleaned)) {
    return { isValid: true, format: 'hex16', cleanedKey: cleaned.toLowerCase() };
  }
  if (patterns.base64.test(cleaned)) {
    return { isValid: true, format: 'base64', cleanedKey: cleaned };
  }

  return {
    isValid: false,
    error: `Invalid key format. Got: ${trimmedKey.substring(0, 50)}...`,
  };
}

export function extractKeyFromCode(code: string, endpoint: string): string | null {
  console.log('[PATTERN-EXTRACT] Attempting pattern-based extraction...');

  const atobPattern = /atob\s*\(\s*["']([A-Za-z0-9+/=]{30,})["']\s*\)/g;
  const atobMatches = [...code.matchAll(atobPattern)];
  
  if (atobMatches.length > 0) {
    for (const match of atobMatches) {
      const base64String = match[1];
      try {
        const decoded = Buffer.from(base64String, 'base64').toString('utf8');
        console.log(`[PATTERN-EXTRACT] Found atob("${base64String}") -> "${decoded}"`);
 
        const validation = validateKey(decoded);
        if (validation.isValid) {
          console.log(`[PATTERN-EXTRACT] Valid key found via atob: ${decoded}`);
          return decoded;
        }
        
        const base64Validation = validateKey(base64String);
        if (base64Validation.isValid) {
          console.log(`[PATTERN-EXTRACT] Valid key found (base64 string): ${base64String}`);
          return base64String;
        }
      } catch (e) {
        // Invalid base64, continue
      }
    }
  }

  const hex64Pattern = /["']([0-9a-f]{64})["']/gi;
  const hex64Matches = [...code.matchAll(hex64Pattern)];
  
  if (hex64Matches.length > 0) {
    const hexKey = hex64Matches[0][1];
    console.log(`[PATTERN-EXTRACT] Found 64-char hex key: ${hexKey}`);
    return hexKey;
  }

  const hex16Pattern = /["']([0-9a-f]{16})["']/gi;
  const hex16Matches = [...code.matchAll(hex16Pattern)];
  
  if (hex16Matches.length > 0) {
    const hexKey = hex16Matches[0][1];
    console.log(`[PATTERN-EXTRACT] Found 16-char hex key: ${hexKey}`);
    return hexKey;
  }

  const returnPattern = /return\s+["']([A-Za-z0-9+/]{16,})["']/g;
  const returnMatches = [...code.matchAll(returnPattern)];
  
  if (returnMatches.length > 0) {
    const possibleKey = returnMatches[0][1];
    const validation = validateKey(possibleKey);
    if (validation.isValid) {
      console.log(`[PATTERN-EXTRACT] Found key in return statement: ${possibleKey}`);
      return possibleKey;
    }
  }

  console.log('[PATTERN-EXTRACT] No valid key found using patterns');
  return null;
}
