export interface RyanPapa {
  name: string;
  url: string;
  outputFile: string;
  category: 'obfuscated' | 'encrypted' | 'simple';
  description?: string;
}

export const ENDPOINTS: RyanPapa[] = [
  // MegaCloud
  {
    name: 'MegaCloud V2',
    url: 'https://megacloud.blog/js/player/a/v2/pro/embed-1.min.js?v=',
    outputFile: 'megacloud_v2.txt',
    category: 'obfuscated',
    description: 'MegaCloud V2 - 64-char hex key'
  },
  {
    name: 'MegaCloud V3',
    url: 'https://megacloud.blog/js/player/a/v3/pro/embed-1.min.js?v=',
    outputFile: 'megacloud_v3.txt',
    category: 'obfuscated',
    description: 'MegaCloud V3 - base64 key'
  },
  
  // CloudVidz 
  {
    name: 'CloudVidz V2',
    url: 'https://cloudvidz.net/js/player/m/v2/pro/embed-1.min.js?v=',
    outputFile: 'cloudvidz_v2.txt',
    category: 'obfuscated',
    description: 'CloudVidz V2 - 16-char hex key'
  },
  {
    name: 'CloudVidz V3',
    url: 'https://cloudvidz.net/js/player/m/v3/pro/embed-1.min.js?v=',
    outputFile: 'cloudvidz_v3.txt',
    category: 'obfuscated',
    description: 'CloudVidz V3 - hex key'
  },
];

export function getEndpointsByCategory(category: RyanPapa['category']): RyanPapa[] {
  return ENDPOINTS.filter(e => e.category === category);
}

export function getEndpointByName(name: string): RyanPapa | undefined {
  return ENDPOINTS.find(e => e.name === name);
}

export function getObfuscatedEndpoints(): RyanPapa[] {
  return getEndpointsByCategory('obfuscated');
}

export function buildEndpointUrl(endpoint: RyanPapa): string {
  if (endpoint.url.endsWith('?v=')) {
    return endpoint.url + Date.now();
  }
  return endpoint.url;
}
