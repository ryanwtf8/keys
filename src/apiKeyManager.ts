import { decryptKeys } from './keyEncryption.js';

export class ApiKeyManager {
  private keys: string[];
  private currentIndex: number = 0;
  private failedKeys: Set<string> = new Set();

  constructor(keys: string | string[], isEncrypted: boolean = false) {
    let rawKeys: string[];
    
    if (typeof keys === 'string') {
      rawKeys = keys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    } else {
      rawKeys = keys;
    }

    if (isEncrypted) {
      this.keys = decryptKeys(rawKeys);
      console.log(`[API-KEY-MANAGER] Decrypted ${this.keys.length} API key(s)`);
    } else {
      this.keys = rawKeys;
      console.log(`[API-KEY-MANAGER] Initialized with ${this.keys.length} API key(s)`);
    }

    if (this.keys.length === 0) {
      throw new Error('No API keys provided');
    }
  }

  getNextKey(): string {
    const availableKeys = this.keys.filter(k => !this.failedKeys.has(k));
    
    if (availableKeys.length === 0) {
      console.log('[API-KEY-MANAGER] All keys failed, resetting...');
      this.failedKeys.clear();
      this.currentIndex = 0;
      return this.keys[0];
    }

    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;

    if (this.failedKeys.has(key)) {
      return this.getNextKey();
    }

    return key;
  }

  markKeyAsFailed(key: string): void {
    this.failedKeys.add(key);
    console.log(`[API-KEY-MANAGER] Marked key as failed: ${key.substring(0, 20)}...`);
    console.log(`[API-KEY-MANAGER] Available keys: ${this.keys.length - this.failedKeys.size}/${this.keys.length}`);
  }

  getTotalKeys(): number {
    return this.keys.length;
  }

  getAvailableKeysCount(): number {
    return this.keys.length - this.failedKeys.size;
  }

  resetFailedKeys(): void {
    this.failedKeys.clear();
    console.log('[API-KEY-MANAGER] Reset all failed keys');
  }
}


const ENCRYPTED_API_KEYS = [
  '724ad74bf0718537a068213877312540220da217e35746748034e05f302b16177158951e160202',
  'c24ab71bc051f507b0680108b754a61ed15ee27cd123757b5239274ab354b67ef138d424073da4',
  'c26a270ba04105377048c128c724901e2539207d643e4466b00df421d24dc5083224a523e16f54',
  '021a071ba011453720786118e751b760731db158e1333454d315104c344ad6162213d529311a82',
  '026ac72bb0715537a0681138f72655685102c376a228654740037653c44dc7756308761d661c44',
  '724a272bb071f5279058d138672786741006c56c73585515902c605fc14c7628300f171ee40a40',
  '026a374bd0111517d05881080737d64435328272802c45432529804a9152b40da225b673e70904',
  '327a374ba061b537104851283727556f510e8251f02c0459f37625504058273d3502860f170d43',
  '327a872b1061c527a018c1781756b667425882645055d019e01c166bd07b46170101062f553a23',
  '024ad72b006105479018810817270060650c431ba42bf67ae2140554922e9477f1343779f73de3',
  '425a274ba0111517f068f108d714a769653ce179e128454bf003a62dc27c3678141fa572b13964',
  '327a274b10412527e048b108b754f7548005d55e8155957161756453347b357053033508d613c3',
  '526ae72bf041c5374048b17867244042a2291147c01b4760051cb747a152060fe536660f276d14',
  '727a174b9041551710786128d724f57eb0009356c43d807da3707754525844355523441f376f53',
];

export const DEFAULT_API_KEYS = ENCRYPTED_API_KEYS;
