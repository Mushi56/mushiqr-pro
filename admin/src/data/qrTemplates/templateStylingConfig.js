// src/data/qrTemplates/templateStylingConfig.js
// Custom tailored eye styles, dot styles, and brand platform colors for all QR templates
// Note: Center logos removed in favor of top icon badge above headline text

import { DOT_STYLES, EYE_STYLES } from '../../utils/qrEngine';

/**
 * Platform Color and Style Mapping
 * Allowed Eyes: ROUNDED, CIRCLE, FLOWER, TRIANGLE (Pillow)
 * Disallowed Eyes Removed: modern, hexagon, notch, teardrop, star, leaf, shield, diamond, geometric, octagon, spotlight
 * Disallowed Dots Removed: plus
 * Allowed Dots: dots, liquid, hbar, vbar, hexagon, rounded, octagon, star, denso, sparkle, capsule, etc.
 */
export const TEMPLATE_STYLING_MAP = {
  // ── Social Media Templates ──
  'facebook': {
    qrColor: '#1877F2',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#1877F2',
    eyeOuterColor: '#0d47a1',
    logo: null
  },
  'threads': {
    qrColor: '#2b2b2b',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#2b2b2b',
    eyeOuterColor: '#4a4a4a',
    logo: null
  },
  'x': {
    qrColor: '#24292e',
    dotStyle: DOT_STYLES.HEXAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#24292e',
    eyeOuterColor: '#333333',
    logo: null
  },
  'twitter': {
    qrColor: '#1DA1F2',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#1DA1F2',
    eyeOuterColor: '#0c85d0',
    logo: null
  },
  'youtube': {
    qrColor: '#FF0000',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF0000',
    eyeOuterColor: '#b31217',
    logo: null
  },
  'tiktok': {
    qrColor: '#25F4EE',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#FE2C55',
    eyeOuterColor: '#25F4EE',
    logo: null
  },
  'linkedin': {
    qrColor: '#0A66C2',
    dotStyle: DOT_STYLES.OCTAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#0A66C2',
    eyeOuterColor: '#004182',
    logo: null
  },
  'reddit': {
    qrColor: '#FF4500',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#FF4500',
    eyeOuterColor: '#ad3b00',
    logo: null
  },
  'discord': {
    qrColor: '#5865F2',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#5865F2',
    eyeOuterColor: '#404EED',
    logo: null
  },
  'spotify': {
    qrColor: '#1DB954',
    dotStyle: DOT_STYLES.CAPSULE,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#1DB954',
    eyeOuterColor: '#12833a',
    logo: null
  },
  'snapchat': {
    qrColor: '#111111',
    dotStyle: DOT_STYLES.LIQUID,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#111111',
    eyeOuterColor: '#333333',
    logo: null
  },
  'pinterest': {
    qrColor: '#BD081C',
    dotStyle: DOT_STYLES.FLOWER,
    eyeStyle: EYE_STYLES.FLOWER,
    eyeColor: '#BD081C',
    eyeOuterColor: '#7a0512',
    logo: null
  },
  'github': {
    qrColor: '#24292F',
    dotStyle: DOT_STYLES.VBAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#24292F',
    eyeOuterColor: '#1b1f23',
    logo: null
  },
  'telegram': {
    qrColor: '#229ED9',
    dotStyle: DOT_STYLES.LIQUID,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#229ED9',
    eyeOuterColor: '#1c5f8a',
    logo: null
  },
  'twitch': {
    qrColor: '#9146FF',
    dotStyle: DOT_STYLES.HBAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#9146FF',
    eyeOuterColor: '#6441A5',
    logo: null
  },
  'vimeo': {
    qrColor: '#1AB7EA',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#1AB7EA',
    eyeOuterColor: '#007799',
    logo: null
  },
  'medium': {
    qrColor: '#02B875',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#02B875',
    eyeOuterColor: '#0f2f24',
    logo: null
  },
  'wechat': {
    qrColor: '#07C160',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#07C160',
    eyeOuterColor: '#0a5c26',
    logo: null
  },
  'skype': {
    qrColor: '#00AFF0',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#00AFF0',
    eyeOuterColor: '#0078D4',
    logo: null
  },
  'zoom': {
    qrColor: '#2D8CFF',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#2D8CFF',
    eyeOuterColor: '#0b5cad',
    logo: null
  },
  'slack': {
    qrColor: '#4A154B',
    dotStyle: DOT_STYLES.OCTAGON,
    eyeStyle: EYE_STYLES.TRIANGLE,
    eyeColor: '#ECB22E',
    eyeOuterColor: '#4A154B',
    logo: null
  },
  'behance': {
    qrColor: '#1769FF',
    dotStyle: DOT_STYLES.SPARKLE,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#1769FF',
    eyeOuterColor: '#0047cc',
    logo: null
  },
  'dribbble': {
    qrColor: '#EA4C89',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#EA4C89',
    eyeOuterColor: '#b5235d',
    logo: null
  },
  'soundcloud': {
    qrColor: '#FF5500',
    dotStyle: DOT_STYLES.CAPSULE,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF5500',
    eyeOuterColor: '#cc4400',
    logo: null
  },
  'patreon': {
    qrColor: '#FF424D',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#FF424D',
    eyeOuterColor: '#052D49',
    logo: null
  },
  'etsy': {
    qrColor: '#F16521',
    dotStyle: DOT_STYLES.FLOWER,
    eyeStyle: EYE_STYLES.FLOWER,
    eyeColor: '#F16521',
    eyeOuterColor: '#b84409',
    logo: null
  },
  'amazon': {
    qrColor: '#FF9900',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF9900',
    eyeOuterColor: '#146eb4',
    logo: null
  },
  'shopify': {
    qrColor: '#96BF48',
    dotStyle: DOT_STYLES.HEXAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#96BF48',
    eyeOuterColor: '#5c7929',
    logo: null
  },
  'apple-music': {
    qrColor: '#FC3C44',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FC3C44',
    eyeOuterColor: '#a11017',
    logo: null
  },
  'whatsapp-channel': {
    qrColor: '#25D366',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#25D366',
    eyeOuterColor: '#075E54',
    logo: null
  },
  'whatsapp': {
    qrColor: '#25D366',
    dotStyle: DOT_STYLES.LIQUID,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#25D366',
    eyeOuterColor: '#075E54',
    logo: null
  },
  'messenger': {
    qrColor: '#0084FF',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#0084FF',
    eyeOuterColor: '#0055b3',
    logo: null
  },
  'instagram': {
    qrColor: '#E4405F',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#E4405F',
    eyeOuterColor: '#833AB4',
    logo: null
  },

  // ── Business, Review & Utility Templates ──
  'google-review': {
    qrColor: '#4285F4',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#EA4335',
    eyeOuterColor: '#4285F4',
    logo: null
  },
  'google': {
    qrColor: '#4285F4',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#EA4335',
    eyeOuterColor: '#4285F4',
    logo: null
  },
  'google-drive': {
    qrColor: '#0F9D58',
    dotStyle: DOT_STYLES.HEXAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#4285F4',
    eyeOuterColor: '#0F9D58',
    logo: null
  },
  'trustpilot-review': {
    qrColor: '#00B67A',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.TRIANGLE,
    eyeColor: '#00B67A',
    eyeOuterColor: '#005a3c',
    logo: null
  },
  'tripadvisor': {
    qrColor: '#34E0A1',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#00AA6C',
    eyeOuterColor: '#004f32',
    logo: null
  },
  'yelp': {
    qrColor: '#FF1A1A',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF1A1A',
    eyeOuterColor: '#af0606',
    logo: null
  },
  'bitcoin': {
    qrColor: '#F7931A',
    dotStyle: DOT_STYLES.HEXAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#F7931A',
    eyeOuterColor: '#8a4b00',
    logo: null
  },
  'crypto': {
    qrColor: '#627EEA',
    dotStyle: DOT_STYLES.OCTAGON,
    eyeStyle: EYE_STYLES.TRIANGLE,
    eyeColor: '#627EEA',
    eyeOuterColor: '#2b3f8c',
    logo: null
  },
  'paypal': {
    qrColor: '#0079C1',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00457C',
    eyeOuterColor: '#0079C1',
    logo: null
  },
  'cash-app': {
    qrColor: '#00D632',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00D632',
    eyeOuterColor: '#008f21',
    logo: null
  },
  'venmo': {
    qrColor: '#008CFF',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#008CFF',
    eyeOuterColor: '#005cb3',
    logo: null
  },
  'menu': {
    qrColor: '#FF5722',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF5722',
    eyeOuterColor: '#b32d00',
    logo: null
  },
  'digital-menu': {
    qrColor: '#FF9800',
    dotStyle: DOT_STYLES.FLOWER,
    eyeStyle: EYE_STYLES.FLOWER,
    eyeColor: '#FF9800',
    eyeOuterColor: '#e65100',
    logo: null
  },
  'restaurant': {
    qrColor: '#E64A19',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#E64A19',
    eyeOuterColor: '#8d1d00',
    logo: null
  },
  'booking': {
    qrColor: '#003580',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#003580',
    eyeOuterColor: '#00224f',
    logo: null
  },
  'reservation': {
    qrColor: '#00B0FF',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00B0FF',
    eyeOuterColor: '#007bb3',
    logo: null
  },
  'event': {
    qrColor: '#7C4DFF',
    dotStyle: DOT_STYLES.SPARKLE,
    eyeStyle: EYE_STYLES.TRIANGLE,
    eyeColor: '#7C4DFF',
    eyeOuterColor: '#4a148c',
    logo: null
  },
  'ticket': {
    qrColor: '#FF6D00',
    dotStyle: DOT_STYLES.OCTAGON,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF6D00',
    eyeOuterColor: '#b34700',
    logo: null
  },
  'movie': {
    qrColor: '#E91E63',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#E91E63',
    eyeOuterColor: '#880e4f',
    logo: null
  },
  'download-app': {
    qrColor: '#00BCD4',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00BCD4',
    eyeOuterColor: '#006064',
    logo: null
  },
  'app': {
    qrColor: '#00BCD4',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00BCD4',
    eyeOuterColor: '#006064',
    logo: null
  },
  'survey': {
    qrColor: '#2979FF',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#2979FF',
    eyeOuterColor: '#004ecb',
    logo: null
  },
  'feedback': {
    qrColor: '#00C853',
    dotStyle: DOT_STYLES.STAR,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00C853',
    eyeOuterColor: '#00701a',
    logo: null
  },
  'loyalty': {
    qrColor: '#FF6D00',
    dotStyle: DOT_STYLES.SPARKLE,
    eyeStyle: EYE_STYLES.TRIANGLE,
    eyeColor: '#FF6D00',
    eyeOuterColor: '#b34700',
    logo: null
  },
  'wifi': {
    qrColor: '#2196F3',
    dotStyle: DOT_STYLES.CAPSULE,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#2196F3',
    eyeOuterColor: '#0b7ad1',
    logo: null
  },
  'website': {
    qrColor: '#00BCD4',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00BCD4',
    eyeOuterColor: '#006064',
    logo: null
  },
  'url': {
    qrColor: '#00BCD4',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#00BCD4',
    eyeOuterColor: '#006064',
    logo: null
  },
  'pdf': {
    qrColor: '#F44336',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#F44336',
    eyeOuterColor: '#b71c1c',
    logo: null
  },
  'document': {
    qrColor: '#607D8B',
    dotStyle: DOT_STYLES.DOTS,
    eyeStyle: EYE_STYLES.CIRCLE,
    eyeColor: '#607D8B',
    eyeOuterColor: '#263238',
    logo: null
  },
  'email': {
    qrColor: '#EA4335',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#EA4335',
    eyeOuterColor: '#9e1b0e',
    logo: null
  },
  'gmail': {
    qrColor: '#EA4335',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#EA4335',
    eyeOuterColor: '#9e1b0e',
    logo: null
  },
  'sms': {
    qrColor: '#4CAF50',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#4CAF50',
    eyeOuterColor: '#1b5e20',
    logo: null
  },
  'message': {
    qrColor: '#34C759',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#34C759',
    eyeOuterColor: '#1e7b34',
    logo: null
  },
  'contact': {
    qrColor: '#FF9800',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FF9800',
    eyeOuterColor: '#e65100',
    logo: null
  },
  'vcard': {
    qrColor: '#FFA36C',
    dotStyle: DOT_STYLES.ROUNDED,
    eyeStyle: EYE_STYLES.ROUNDED,
    eyeColor: '#FFA36C',
    eyeOuterColor: '#d96c2f',
    logo: null
  }
};

/**
 * Returns complete styling preset for a template
 */
export function getTemplateStylingPreset(template) {
  if (!template) return null;

  // If vCard, keep clean styling
  if (template.styleFamily === 'vcard') {
    return template.preset || {
      qrColor: template.accent || '#FFA36C',
      bgColor: '#FFFFFF',
      dotStyle: DOT_STYLES.ROUNDED,
      eyeStyle: EYE_STYLES.ROUNDED,
      logo: null
    };
  }

  const lookupKey = (template.baseId || template.id || '').replace(/^brand-/, '').toLowerCase();
  const custom = TEMPLATE_STYLING_MAP[lookupKey];

  if (custom) {
    return {
      qrColor: custom.qrColor,
      bgColor: '#FFFFFF',
      dotStyle: custom.dotStyle,
      eyeStyle: custom.eyeStyle,
      eyeColor: custom.eyeColor || custom.qrColor,
      eyeOuterColor: custom.eyeOuterColor || custom.qrColor,
      logo: null
    };
  }

  // Fallback palette derived from template background or accent
  const fallbackDot = DOT_STYLES.ROUNDED;
  const fallbackEye = EYE_STYLES.ROUNDED;
  const fallbackColor = template.accent || '#1e293b';

  return {
    qrColor: fallbackColor,
    bgColor: '#FFFFFF',
    dotStyle: fallbackDot,
    eyeStyle: fallbackEye,
    eyeColor: fallbackColor,
    eyeOuterColor: fallbackColor,
    logo: null
  };
}
