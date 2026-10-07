// src/data/qrTemplates/index.js
// Master registry of all templates — standard categories + vCard + Scan Me Frames

import { SOCIAL_TEMPLATES }         from './socialTemplates';
import { BUSINESS_TEMPLATES }       from './businessTemplates';
import { COMMUNICATION_TEMPLATES }  from './communicationTemplates';
import { MARKETING_TEMPLATES }      from './marketingTemplates';
import { UTILITY_TEMPLATES }        from './utilityTemplates';
import { BRAND_TEMPLATES }          from './brandTemplates';
import { VCARD_TEMPLATES }          from './vcardTemplates';
import { FRAME_TEMPLATES }          from './frameTemplates';
import { NETWORK_TEMPLATES }        from './networkTemplates';
import { ANIMAL_TEMPLATES }         from './animalTemplates';

export const TEMPLATE_CATEGORIES = [
  'All',
  'Scan Me Frames',
  'Cute Animals',
  'Social Media',
  'Business',
  'Communication',
  'Marketing',
  'Utility',
  'vCard'
];

// Master popularity priority order (most popular / most used first, niche/specialized last)
export const PLATFORM_POPULARITY_ORDER = [
  // ── 1. Top Tier: Mega Platforms & Essential Utilities ──
  'website',
  'url',
  'google',
  'facebook',
  'instagram',
  'whatsapp',
  'youtube',
  'tiktok',
  'wifi',
  'contact',
  'vcard',
  'email',
  'sms',
  'message',
  'location',
  'app',
  'download-app',
  'app-store',
  'play-store',

  // ── 2. High Tier: Major Professional & Social Networks ──
  'linkedin',
  'x',
  'twitter',
  'threads',
  'telegram',
  'spotify',
  'snapchat',
  'pinterest',
  'reddit',
  'discord',
  'github',
  'drive',
  'google-drive',
  'pdf',
  'document',
  'resume',

  // ── 3. Mid Tier: Commerce, Content & Collaboration ──
  'amazon',
  'shopify',
  'etsy',
  'payment',
  'paypal',
  'cashapp',
  'venmo',
  'menu',
  'digital-menu',
  'restaurant',
  'feedback',
  'review',
  'survey',
  'online-survey',
  'event',
  'ticket',
  'booking',
  'reservation',
  'loyalty',
  'coupon',
  'discount',
  'businesscard',

  // ── 4. Creative, Streaming & Niche Channels ──
  'twitch',
  'vimeo',
  'video',
  'medium',
  'linkhub',
  'newsletter',
  'skype',
  'zoom',
  'slack',
  'wechat',
  'behance',
  'dribbble',
  'soundcloud',
  'podcast',
  'patreon',
  'trustpilot',
  'movie',
  'yelp',
  'donation'
];

/**
 * Normalizes any template ID or baseId to its canonical platform key
 */
function getTemplatePlatformKey(template) {
  const rawId = (template.baseId || template.id || '').toLowerCase();
  const cleanId = rawId.replace(/^(brand-|network-|frame-)/, '');
  if (cleanId.includes('google-drive')) return 'drive';
  if (cleanId.includes('download-app')) return 'app';
  if (cleanId.includes('digital-menu')) return 'menu';
  if (cleanId.includes('online-survey')) return 'survey';
  if (cleanId.includes('reservation')) return 'booking';
  return cleanId;
}

// ── Build grouped templates: all variations of the same platform sit together ──
const standardAndBrandPool = [
  ...SOCIAL_TEMPLATES,
  ...BUSINESS_TEMPLATES,
  ...COMMUNICATION_TEMPLATES,
  ...MARKETING_TEMPLATES,
  ...UTILITY_TEMPLATES,
  ...BRAND_TEMPLATES,
  ...NETWORK_TEMPLATES
];

// Group by canonical platform key
const platformGroups = new Map();
standardAndBrandPool.forEach(template => {
  const key = getTemplatePlatformKey(template);
  if (!platformGroups.has(key)) {
    platformGroups.set(key, []);
  }
  platformGroups.get(key).push(template);
});

// Assemble ordered templates by popularity ranking
const groupedStandardTemplates = [];
const processedKeys = new Set();

// 1. Add ordered platforms in priority sequence
PLATFORM_POPULARITY_ORDER.forEach(key => {
  if (platformGroups.has(key)) {
    groupedStandardTemplates.push(...platformGroups.get(key));
    processedKeys.add(key);
  }
});

// 2. Append any remaining platforms not explicitly in popularity list
for (const [key, group] of platformGroups.entries()) {
  if (!processedKeys.has(key)) {
    groupedStandardTemplates.push(...group);
  }
}

export const ALL_TEMPLATES_REGISTRY = [
  ...ANIMAL_TEMPLATES,
  ...FRAME_TEMPLATES,
  ...groupedStandardTemplates,
  ...VCARD_TEMPLATES
];

// For backward compatibility
export const ALL_50_TEMPLATES = ALL_TEMPLATES_REGISTRY;

export function getTemplateById(id) {
  if (!id) return null;
  return ALL_TEMPLATES_REGISTRY.find(t => t.id === id) || null;
}

export function searchTemplates(query = '', category = 'All') {
  const q = query.trim().toLowerCase();
  return ALL_TEMPLATES_REGISTRY.filter(template => {
    const matchesCategory = category === 'All' || template.category === category;
    if (!matchesCategory) return false;
    if (!q) return true;

    const matchName     = (template.name     || '').toLowerCase().includes(q);
    const matchId       = (template.id       || '').toLowerCase().includes(q);
    const matchCategory = (template.category || '').toLowerCase().includes(q);
    const matchHeadline = (template.headline || '').toLowerCase().includes(q);
    const matchSubtitle = (template.subtitle || '').toLowerCase().includes(q);

    return matchName || matchId || matchCategory || matchHeadline || matchSubtitle;
  });
}

export {
  FRAME_TEMPLATES,
  ANIMAL_TEMPLATES,
  NETWORK_TEMPLATES,
  SOCIAL_TEMPLATES,
  BUSINESS_TEMPLATES,
  COMMUNICATION_TEMPLATES,
  MARKETING_TEMPLATES,
  UTILITY_TEMPLATES,
  BRAND_TEMPLATES,
  VCARD_TEMPLATES
};
