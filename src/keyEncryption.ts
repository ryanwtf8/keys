function xorEncrypt(data: string, key: string): string {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const dataChar = data.charCodeAt(i);
    const xored = dataChar ^ keyChar ^ (i % 256);
    result.push(xored);
  }
  return Buffer.from(result).toString('hex');
}

function xorDecrypt(hexData: string, key: string): string {
  const data = Buffer.from(hexData, 'hex');
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const dataChar = data[i];
    const xored = dataChar ^ keyChar ^ (i % 256);
    result.push(xored);
  }
  return String.fromCharCode(...result);
}

function getRuntimeKey(): string {
  const parts = [
    'k3y5_d30bfu5c4t0r',        
    'g3m1n1_p0w3r3d',             
    Buffer.from('typescript').toString('base64'),
    new Date('2026-01-01').getTime().toString(36),
  ];
  return parts.join('::');
}

function interleaveHex(hex: string): string {
  const mid = Math.floor(hex.length / 2);
  const part1 = hex.slice(0, mid);
  const part2 = hex.slice(mid);
  
  let result = '';
  for (let i = 0; i < Math.max(part1.length, part2.length); i++) {
    if (i < part2.length) result += part2[i];
    if (i < part1.length) result += part1[i];
  }
  return result;
}

function deinterleaveHex(hex: string): string {
  const part1: string[] = [];
  const part2: string[] = [];
  
  for (let i = 0; i < hex.length; i++) {
    if (i % 2 === 0) {
      part2.push(hex[i]);
    } else {
      part1.push(hex[i]);
    }
  }
  
  return part1.join('') + part2.join('');
}

export function encryptKey(apiKey: string): string {
  const runtimeKey = getRuntimeKey();
  const encrypted = xorEncrypt(apiKey, runtimeKey);
  const interleaved = interleaveHex(encrypted);
  return interleaved;
}

export function decryptKey(encryptedKey: string): string {
  const runtimeKey = getRuntimeKey();
  const deinterleaved = deinterleaveHex(encryptedKey);
  const decrypted = xorDecrypt(deinterleaved, runtimeKey);
  return decrypted;
}

export function encryptKeys(keys: string[]): string[] {
  return keys.map(encryptKey);
}

export function decryptKeys(encryptedKeys: string[]): string[] {
  return encryptedKeys.map(decryptKey);
}

export function verifyEncryption(original: string, encrypted: string): boolean {
  try {
    const decrypted = decryptKey(encrypted);
    return decrypted === original;
  } catch (error) {
    return false;
  }
}
