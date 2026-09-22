// admin/src/components/VisualQRControlStudio.jsx
// ─── Complete Visual QR Feature, Shapes, Logos, Textures & Fonts Studio ─────
// Comprehensive WYSIWYG studio for Super Admins. Controls all 18 QR content types,
// 37 dot shapes (with live canvas render), 35 eye shapes (with live canvas render),
// 40 brand logos, 9 social textures, 12 dual-gradients, 8 background shapes,
// 30 typography fonts, 12 scan-me frames, and 20+ templates with 1-click Free/Pro & Active toggles.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  QrCode, Sparkles, Shield, Crown, Power, XCircle, Search, Check,
  Palette, Sliders, Image, Type, Download, Share2, Layers, RefreshCw,
  FileText, Globe, Wifi, Mail, Phone, MessageSquare, User, MapPin,
  FileSpreadsheet, Music, Calendar, DollarSign, MessageCircle, Video,
  Send, AtSign, CheckCircle2, SlidersHorizontal, ChevronRight, Eye,
  Grid, Box, Wand2, ArrowRightLeft, Lock, Unlock, EyeOff, LayoutGrid,
  FileCheck, Star, Heart, Bookmark, UploadCloud, Brush, Layers2,
  Eraser, Paintbrush, Maximize, Settings
} from 'lucide-react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { setFeatureFlagCloud, setFeatureFlagsBatchCloud, setFeaturesTierBatchCloud } from '../services/adminDataService';
import { FEATURE_REGISTRY } from '../services/FeatureAccessManager';
import { drawDotModule, drawEye, renderQR, generateQRMatrix } from '../utils/qrEngine.js';
import { QR_TEMPLATES } from '../utils/qrTemplates.js';
import { TemplateCard } from '../components/qr-templates/TemplateCard';
import qrcode from 'qrcode-generator';

// ─── 1. RAW CATALOG DATA ───────────────────────────────────────────────────

export const ALL_DOT_STYLES = [
  { id: 'denso', name: 'Denso Classic', desc: 'Standard square matrix' },
  { id: 'dots', name: 'Circular Dots', desc: 'Smooth round dot modules' },
  { id: 'sparkle', name: 'Diamond Sparkle', desc: 'Radiant 4-point sparkle' },
  { id: 'fluid', name: 'Fluid Liquid', desc: 'Organic connected fluid curves' },
  { id: 'capsule', name: 'Capsule Pill', desc: 'Rounded vertical capsules' },
  { id: 'hexagon', name: 'Hexagon Tech', desc: 'Futuristic 6-sided polygon' },
  { id: 'square', name: 'Crisp Square', desc: 'Sharp geometric squares' },
  { id: 'rounded', name: 'Rounded Corners', desc: 'Softened square modules' },
  { id: 'leaf', name: 'Nature Leaf', desc: 'Organic curved leaf shapes' },
  { id: 'diamond', name: 'Precious Diamond', desc: '45-degree angled diamond' },
  { id: 'pixel', name: 'Retro Pixel', desc: '8-bit arcade retro style' },
  { id: 'shield', name: 'Knight Shield', desc: 'Protective shield badges' },
  { id: 'star', name: '5-Point Star', desc: 'Decorative golden stars' },
  { id: 'heart', name: 'Love Heart', desc: 'Romantic heart shapes' },
  { id: 'triangle', name: 'Modern Triangle', desc: 'Sharp delta geometry' },
  { id: 'octagon', name: 'Stop Octagon', desc: '8-sided industrial stop style' },
  { id: 'plus', name: 'Plus Cross', desc: 'Medical and geometric cross' },
  { id: 'cross', name: 'Diagonal Cross', desc: 'X-form dynamic module' },
  { id: 'cherry-blossom', name: 'Cherry Blossom', desc: 'Japanese sakura floral petals' },
  { id: 'violet-flower', name: 'Violet Flower', desc: 'Petal flower flourish' },
  { id: 'sunflower', name: 'Summer Sunflower', desc: 'Radiant sunburst petals' },
  { id: 'rose', name: 'Royal Rose', desc: 'Intricate blooming rose petals' },
  { id: 'daisy', name: 'Spring Daisy', desc: 'Multi-petal daisy flora' },
  { id: 'tulip', name: 'Spring Tulip', desc: 'Dutch tulip cup floral' },
  { id: 'lotus', name: 'Zen Lotus', desc: 'Spiritual floating water lotus' },
  { id: 'forget-me-not', name: 'Forget Me Not', desc: 'Delicate floral pattern' },
  { id: 'pansy', name: 'Colorful Pansy', desc: 'Garden bloom module' },
  { id: 'dollar-coin', name: 'Dollar Coin', desc: 'Financial dollar token badge' },
  { id: 'cute-emoticon', name: 'Cute Emoji Smile', desc: 'Playful smiley face avatar' },
  { id: 'lavender', name: 'Provence Lavender', desc: 'Herbaceous botanical sprig' },
  { id: 'monstera', name: 'Tropical Monstera', desc: 'Exotic jungle palm leaf' },
  { id: 'coffee-bean', name: 'Coffee Bean', desc: 'Artisanal roasted coffee bean' },
  { id: 'raindrop', name: 'Water Raindrop', desc: 'Teardrop moisture drop' },
  { id: 'cactus-plant', name: 'Desert Cactus', desc: 'Southwest succulent cactus' },
  { id: 'basketball-dot', name: 'Basketball', desc: 'Sport basketball orb' },
  { id: 'chess-pawn', name: 'Chess Pawn', desc: 'Strategic chess piece' },
  { id: 'bow-ribbon', name: 'Gift Bow Ribbon', desc: 'Celebration gift tie' }
];

export const ALL_EYE_STYLES = [
  { id: 'square', name: 'Square Standard', desc: 'Classic square finder corners' },
  { id: 'rounded', name: 'Rounded Frame', desc: 'Gentle rounded corners' },
  { id: 'circle', name: 'Circle Eye', desc: 'Target ring concentric circles' },
  { id: 'leaf', name: 'Curved Leaf', desc: 'Organic plant leaf contour' },
  { id: 'teardrop', name: 'Teardrop Angle', desc: 'Fluid droplet point' },
  { id: 'modern', name: 'Modern Dual', desc: 'Contemporary double-beveled' },
  { id: 'flower', name: 'Floral Eye', desc: 'Botanical petal corner' },
  { id: 'shield', name: 'Security Shield', desc: 'Defensive badge shape' },
  { id: 'diamond', name: 'Diamond Gem', desc: 'Angled jewel finder' },
  { id: 'geometric', name: 'Geometric Hex', desc: 'Sharp futuristic contour' },
  { id: 'octagon', name: 'Octagon Frame', desc: '8-sided industrial corner' },
  { id: 'hexagon', name: 'Hexagonal Tech', desc: '6-sided cyber frame' },
  { id: 'notch', name: 'LCD Notched', desc: 'Cyberpunk corner cuts' },
  { id: 'star', name: 'Golden Star Eye', desc: '5-pointed celestial star' },
  { id: 'spotlight', name: 'Spotlight Beacon', desc: 'Circular glow lens' },
  { id: 'pillow', name: 'Pillow Cushion', desc: 'Concave cushion edges' },
  { id: 'dollar-coin', name: 'Dollar Coin Eye', desc: 'Fintech coin badge' },
  { id: 'cute-emoticon', name: 'Emoji Smile Eye', desc: 'Playful character eye' },
  { id: 'cherry-blossom', name: 'Sakura Eye', desc: 'Cherry blossom petal eye' },
  { id: 'lotus', name: 'Lotus Bloom Eye', desc: 'Zen flower corner' },
  { id: 'sunflower', name: 'Sunflower Eye', desc: 'Radiant sunflower frame' },
  { id: 'lavender', name: 'Lavender Eye', desc: 'Botanical corner eye' },
  { id: 'rose', name: 'Rose Petal Eye', desc: 'Blooming rose corner' },
  { id: 'monstera', name: 'Monstera Leaf Eye', desc: 'Palm frond eye' },
  { id: 'daisy', name: 'Daisy Eye', desc: 'Floral daisy eye' },
  { id: 'coffee-bean-eye', name: 'Coffee Roaster Eye', desc: 'Cafe branded corner' },
  { id: 'raindrop-eye', name: 'Raindrop Eye', desc: 'Water droplet eye' },
  { id: 'cactus-eye', name: 'Cactus Eye', desc: 'Succulent plant corner' },
  { id: 'basketball-eye', name: 'Basketball Eye', desc: 'Sports ball finder' },
  { id: 'chess-eye', name: 'Chess Crown Eye', desc: 'Chess piece corner' },
  { id: 'bow-eye', name: 'Bow Ribbon Eye', desc: 'Gift ribbon corner' },
  { id: 'violet-flower-eye', name: 'Violet Flower Eye', desc: 'Petal flower corner' },
  { id: 'tulip-eye', name: 'Tulip Eye', desc: 'Spring tulip corner' },
  { id: 'forget-me-not-eye', name: 'Forget Me Not Eye', desc: 'Delicate floral eye' },
  { id: 'pansy-eye', name: 'Pansy Bloom Eye', desc: 'Garden pansy eye' }
];

export const ALL_LOGO_PRESETS = [
  { slug: 'custom-icon', name: 'Custom App Icon', color: '#D60036', url: '/presets/Icon.avif' },
  { slug: 'facebook', name: 'Facebook', color: '#1877F2', url: '/presets/facebook.avif' },
  { slug: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: '/presets/whatsapp.avif' },
  { slug: 'instagram', name: 'Instagram', color: '#E4405F', url: '/presets/instagram.avif' },
  { slug: 'youtube', name: 'YouTube', color: '#FF0000', url: '/presets/youtube.avif' },
  { slug: 'tiktok', name: 'TikTok', color: '#000000', url: '/presets/tiktok.avif' },
  { slug: 'linkedin', name: 'LinkedIn', color: '#0A66C2', url: '/presets/linkedin.avif' },
  { slug: 'twitter', name: 'Twitter / X', color: '#1DA1F2', url: '/presets/twitter.avif' },
  { slug: 'gmail', name: 'Gmail Email', color: '#EA4335', url: '/presets/gmail.avif' },
  { slug: 'github', name: 'GitHub Code', color: '#24292F', url: '/presets/github.avif' },
  { slug: 'spotify', name: 'Spotify Music', color: '#1DB954', url: '/presets/spotify.avif' },
  { slug: 'apple', name: 'Apple Brand', color: '#A2AAAD', url: '/presets/apple.avif' },
  { slug: 'picsart', name: 'Picsart Studio', color: '#00C5FF', url: '/presets/Picsart_26-07-18_11-14-07-816.avif' },
  { slug: 'messenger', name: 'FB Messenger', color: '#0084FF', url: '/presets/messenger.avif' },
  { slug: 'pinterest', name: 'Pinterest Pin', color: '#BD081C', url: '/presets/pinterest.avif' },
  { slug: 'reddit', name: 'Reddit Community', color: '#FF4500', url: '/presets/reddit.avif' },
  { slug: 'internet', name: 'Global Web', color: '#00BCD4', url: '/presets/internet.avif' },
  { slug: 'wifi', name: 'Wi-Fi Signal', color: '#2196F3', url: '/presets/wifi.avif' },
  { slug: 'id-card', name: 'vCard ID Badge', color: '#FF9800', url: '/presets/id-card.avif' },
  { slug: 'sms', name: 'SMS Chat', color: '#4CAF50', url: '/presets/sms.avif' },
  { slug: 'pdf', name: 'Adobe PDF Doc', color: '#F44336', url: '/presets/pdf.avif' },
  { slug: 'bitcoin', name: 'Bitcoin Crypto', color: '#F7931A', url: '/presets/bitcoin.avif' },
  { slug: 'chatting', name: 'Direct Chat', color: '#4CAF50', url: '/presets/chatting.avif' },
  { slug: 'dribbble', name: 'Dribbble Design', color: '#EA4C89', url: '/presets/dribbble.avif' },
  { slug: 'behance', name: 'Behance Portfolio', color: '#1769FF', url: '/presets/behance.avif' },
  { slug: 'whatsapp-1', name: 'WhatsApp Secondary', color: '#25D366', url: '/presets/whatsapp (1).avif' },
  { slug: 'gmail-1', name: 'Gmail Secondary', color: '#EA4335', url: '/presets/gmail (1).avif' },
  { slug: 'messenger-1', name: 'Messenger Secondary', color: '#0084FF', url: '/presets/messenger (1).avif' },
  { slug: 'wifi-1', name: 'Wi-Fi Secondary', color: '#2196F3', url: '/presets/wifi (1).avif' },
  { slug: 'youtube-1', name: 'YouTube Secondary', color: '#FF0000', url: '/presets/youtube (1).avif' },
  { slug: 'google-calendar', name: 'Google Calendar', color: '#4285F4', url: '/presets/google-calendar.avif' },
  { slug: 'google-maps', name: 'Google Maps GPS', color: '#34A853', url: '/presets/google-maps.avif' },
  { slug: 'google-play', name: 'Google Play Store', color: '#4285F4', url: '/presets/google-play.avif' },
  { slug: 'internet-connection', name: 'Internet Connection', color: '#2196F3', url: '/presets/internet-connection.avif' },
  { slug: 'january', name: 'Calendar Date', color: '#E91E63', url: '/presets/january.avif' },
  { slug: 'picture', name: 'Image Gallery Badge', color: '#9C27B0', url: '/presets/picture.avif' },
  { slug: 'skype', name: 'Skype Video', color: '#00AFF0', url: '/presets/skype.avif' },
  { slug: 'social', name: 'Social Group', color: '#3F51B5', url: '/presets/social.avif' },
  { slug: 'tik-tok', name: 'TikTok Secondary', color: '#000000', url: '/presets/tik-tok.avif' },
  { slug: 'viber', name: 'Viber Messenger', color: '#7360F2', url: '/presets/viber.avif' },
  { slug: 'vimeo', name: 'Vimeo Video', color: '#1AB7EA', url: '/presets/vimeo.avif' }
];

export const SOCIAL_TEXTURES = [
  { slug: 'facebook', name: 'Facebook', color: '#1877F2', url: '/textures/facebook_texture.webp' },
  { slug: 'whatsapp', name: 'WhatsApp', color: '#25D366', url: '/textures/whatsapp_texture.webp' },
  { slug: 'instagram', name: 'Instagram', color: '#E4405F', url: '/textures/instagram_texture.webp' },
  { slug: 'youtube', name: 'YouTube', color: '#FF0000', url: '/textures/youtube_texture.webp' },
  { slug: 'tiktok', name: 'TikTok', color: '#000000', url: '/textures/tiktok_texture.webp' },
  { slug: 'snapchat', name: 'Snapchat', color: '#FFFC00', url: '/textures/snapchat_texture.webp' },
  { slug: 'twitter', name: 'Twitter / X', color: '#1DA1F2', url: '/textures/twitter_texture.webp' },
  { slug: 'telegram', name: 'Telegram', color: '#0088CC', url: '/textures/telegram_texture.webp' },
  { slug: 'spotify', name: 'Spotify', color: '#1DB954', url: '/textures/spotify_texture.webp' }
];

export const ALL_TEXTURES = [
  { slug: 'facebook', name: 'Facebook Texture', color: '#1877F2', url: '/textures/facebook_texture.webp' },
  { slug: 'whatsapp', name: 'WhatsApp Texture', color: '#25D366', url: '/textures/whatsapp_texture.webp' },
  { slug: 'instagram', name: 'Instagram Gradient Texture', color: '#E4405F', url: '/textures/instagram_texture.webp' },
  { slug: 'youtube', name: 'YouTube Video Texture', color: '#FF0000', url: '/textures/youtube_texture.webp' },
  { slug: 'tiktok', name: 'TikTok Dark Texture', color: '#000000', url: '/textures/tiktok_texture.webp' },
  { slug: 'snapchat', name: 'Snapchat Yellow Texture', color: '#FFFC00', url: '/textures/snapchat_texture.webp' },
  { slug: 'twitter', name: 'Twitter / X Texture', color: '#1DA1F2', url: '/textures/twitter_texture.webp' },
  { slug: 'telegram', name: 'Telegram Blue Texture', color: '#0088CC', url: '/textures/telegram_texture.webp' },
  { slug: 'spotify', name: 'Spotify Wave Texture', color: '#1DB954', url: '/textures/spotify_texture.webp' },
  { slug: 'custom_upload', name: 'Custom Photo Texture Upload', color: '#8B5CF6', isUpload: true, desc: 'Upload custom image pattern' }
];

export const ALL_COLOR_TOOLS = [
  { 
    id: 'qr_color_presets', 
    name: 'Color Presets Gallery', 
    desc: 'Pre-designed solid & gradient multi-color theme swatch gallery',
    category: 'Color Tools',
    icon: Bookmark,
    defaultPlan: 'free'
  },
  { 
    id: 'qr_color_dots', 
    name: 'Dots Custom Color Tool', 
    desc: 'Fine-tune custom solid hex/RGB colors and dual gradients for dot modules',
    category: 'Color Tools',
    icon: Grid,
    defaultPlan: 'free'
  },
  { 
    id: 'qr_color_eyes', 
    name: 'Eyes Color Customizer', 
    desc: 'Independent color pickers for corner finder outer frame & inner pupil',
    category: 'Color Tools',
    icon: Eye,
    defaultPlan: 'free'
  },
  { 
    id: 'qr_color_bg', 
    name: 'Background Color & Transparency', 
    desc: 'Custom canvas background color picker and transparent background toggle',
    category: 'Color Tools',
    icon: Palette,
    defaultPlan: 'free'
  },
  { 
    id: 'qr_color_bg_image', 
    name: 'Background Photo & Texture Canvas', 
    desc: 'Upload custom background images, overlay dimming slider & contrast container',
    category: 'Color Tools',
    icon: Image,
    defaultPlan: 'weekly'
  }
];

export const ALL_COLOR_THEME_PRESETS = [
  { id: 'classic', name: 'Classic B&W', qr: '#000000', bg: '#FFFFFF', desc: 'Standard high-contrast' },
  { id: 'midnight', name: 'Midnight Dark', qr: '#FFFFFF', bg: '#030305', desc: 'Sleek dark theme' },
  { id: 'vibrant_red', name: 'Vibrant Red', qr: '#FF3B30', bg: '#FFFFFF', desc: 'Bright fiery red' },
  { id: 'electric_blue', name: 'Electric Blue', qr: '#007AFF', bg: '#FFFFFF', desc: 'Pure vivid iOS blue' },
  { id: 'emerald', name: 'Emerald Green', qr: '#34C759', bg: '#FFFFFF', desc: 'Vibrant clean emerald' },
  { id: 'sunny', name: 'Sunny Gold', qr: '#FFCC00', bg: '#FFFFFF', desc: 'Golden sunshine yellow' },
  { id: 'purple_neon', name: 'Purple Neon', qr: '#AF52DE', bg: '#0F0F1A', desc: 'Cyber violet glow' },
  { id: 'orange_glow', name: 'Orange Glow', qr: '#FF9500', bg: '#FFFFFF', desc: 'Warm glowing orange' },
  { id: 'indigo', name: 'Indigo Deep', qr: '#5856D6', bg: '#FFFFFF', desc: 'Modern deep indigo' },
  { id: 'pink_punch', name: 'Pink Punch', qr: '#FF2D55', bg: '#FFFFFF', desc: 'Punchy vibrant pink' },
  { id: 'cyan_neon', name: 'Cyan Neon', qr: '#00F0FF', bg: '#0A0A0F', desc: 'Futuristic aqua cyan' },
  { id: 'rose_gold', name: 'Rose Gold', qr: '#E91E63', bg: '#FFF1F2', desc: 'Elegant rose pastel' },
  { id: 'deep_ocean', name: 'Deep Ocean', qr: '#1A237E', bg: '#E8EAF6', desc: 'Deep navy maritime' },
  { id: 'forest', name: 'Forest Green', qr: '#1B5E20', bg: '#E8F5E9', desc: 'Fresh organic canopy' },
  { id: 'hot_chili', name: 'Hot Chili', qr: '#B71C1C', bg: '#FFEBEE', desc: 'Spicy ruby crimson' },
  { id: 'amber', name: 'Amber Glow', qr: '#FF6F00', bg: '#FFF8E1', desc: 'Rich glowing amber' },
  { id: 'teal_mist', name: 'Teal Mist', qr: '#004D40', bg: '#E0F2F1', desc: 'Subtle calming teal' },
  { id: 'slate', name: 'Slate Gray', qr: '#263238', bg: '#ECEFF1', desc: 'Executive slate' },
  { id: 'royal_purple', name: 'Royal Purple', qr: '#4A148C', bg: '#F3E5F5', desc: 'Majestic deep purple' },
  { id: 'lemonade', name: 'Lemonade', qr: '#FBC02D', bg: '#FFFDE7', desc: 'Zesty lemon yellow' },
  { id: 'cyberpunk', name: 'Cyberpunk', qr: '#FFFF00', bg: '#FF00FF', desc: 'High energy cyberpunk' },
  { id: 'matrix', name: 'Matrix Green', qr: '#00FF00', bg: '#000000', desc: 'Terminal matrix green' },
  { id: 'blood_orange', name: 'Blood Orange', qr: '#FF3D00', bg: '#FBE9E7', desc: 'Bold citrus orange' },
  { id: 'space_grey', name: 'Space Grey', qr: '#9E9E9E', bg: '#212121', desc: 'Stealth industrial gray' },
  { id: 'mint_leaf', name: 'Mint Leaf', qr: '#00B894', bg: '#E8FDF9', desc: 'Refreshing crisp mint' },
  { id: 'grape', name: 'Grape Violet', qr: '#6C5CE7', bg: '#EFEEFE', desc: 'Rich grape violet' },
  { id: 'sky_high', name: 'Sky High', qr: '#0984E3', bg: '#EBF5FF', desc: 'Open sky blue' },
  { id: 'coral', name: 'Coral Red', qr: '#D63031', bg: '#FFFAFA', desc: 'Warm coral tone' },
  { id: 'golden_hour', name: 'Golden Hour', qr: '#F39C12', bg: '#1A1A1A', desc: 'Sunset golden glow' },
  { id: 'tropical', name: 'Tropical Aqua', qr: '#00D1B2', bg: '#F5FFFA', desc: 'Exotic lagoon teal' },
  { id: 'volcano', name: 'Volcano Flame', qr: '#E74C3C', bg: '#34495E', desc: 'Lava on dark slate' },
  { id: 'amethyst', name: 'Amethyst', qr: '#9B59B6', bg: '#F4ECF7', desc: 'Pastel jewel amethyst' },
  { id: 'cobalt', name: 'Cobalt Blue', qr: '#2980B9', bg: '#EBF5FB', desc: 'Deep brilliant cobalt' },
  { id: 'pumpkin', name: 'Pumpkin Orange', qr: '#D35400', bg: '#FBEEE6', desc: 'Autumn pumpkin hue' },
  { id: 'asbestos', name: 'Asbestos Mineral', qr: '#7F8C8D', bg: '#F2F4F4', desc: 'Neutral smooth gray' },
  { id: 'belize', name: 'Belize Blue', qr: '#2980B9', bg: '#2C3E50', desc: 'Caribbean dark ocean' },
  { id: 'carrot', name: 'Carrot Sunset', qr: '#E67E22', bg: '#1A1A1A', desc: 'Dark amber carrot' },
  { id: 'sunflower', name: 'Sunflower Yellow', qr: '#F1C40F', bg: '#2C3E50', desc: 'Sunflower on midnight' },
  { id: 'turquoise', name: 'Turquoise Calm', qr: '#1ABC9C', bg: '#16A085', desc: 'Monochrome turquoise' },
  { id: 'wet_asphalt', name: 'Wet Asphalt', qr: '#ECF0F1', bg: '#34495E', desc: 'Minimalist street grey' },
  { id: 'alizarin', name: 'Alizarin Crimson', qr: '#E74C3C', bg: '#FFFFFF', desc: 'Pure artistic crimson' },
  { id: 'wisteria', name: 'Wisteria Bloom', qr: '#8E44AD', bg: '#FFFFFF', desc: 'Lavender floral purple' },
  { id: 'silver', name: 'Silver Slate', qr: '#2C3E50', bg: '#BDC3C7', desc: 'Modern metallic silver' },
  { id: 'concrete', name: 'Concrete Clean', qr: '#FFFFFF', bg: '#95A5A6', desc: 'Clean architectural' },
  { id: 'green_sea', name: 'Green Sea', qr: '#FFFFFF', bg: '#16A085', desc: 'Deep maritime sea' },
  { id: 'shadow', name: 'Dark Shadow', qr: '#34495E', bg: '#2C3E50', desc: 'Dark stealth minimal' },
  { id: 'midnight_blue', name: 'Midnight Blue', qr: '#2C3E50', bg: '#FFFFFF', desc: 'Corporate deep navy' },
  { id: 'soft_pink', name: 'Soft Pink', qr: '#FF80AB', bg: '#FCE4EC', desc: 'Delicate pastel pink' },
  { id: 'cool_mint', name: 'Cool Mint', qr: '#1DE9B6', bg: '#E0F2F1', desc: 'Icy cool mint' },
  { id: 'light_blue', name: 'Light Blue', qr: '#00B0FF', bg: '#E1F5FE', desc: 'Clear daylight blue' },
  { id: 'warm_amber', name: 'Warm Amber', qr: '#FFAB00', bg: '#FFF8E1', desc: 'Golden warm honey' },
  { id: 'deep_purple', name: 'Deep Purple', qr: '#6200EA', bg: '#EDE7F6', desc: 'Intense ultraviolet' }
];

export const ALL_LOGO_CONTROLS = [
  { id: 'custom_logo_upload', name: 'Custom Brand Logo Upload', desc: 'Upload personal image/photo logo inside QR center', icon: UploadCloud, defaultPlan: 'weekly' },
  { id: 'custom_logo_presets', name: 'Brand Logo Presets Gallery', desc: 'Pre-installed library of 41 social, fintech & tech brand logos', icon: Image, defaultPlan: 'free' },
  { id: 'qr_logo_transforms', name: 'Logo Transforms (Size, Rotate, Opacity)', desc: 'Full transform suite: scale percentage, rotation angle & opacity slider', icon: Sliders, defaultPlan: 'free' },
  { id: 'qr_logo_stroke_shadow', name: 'Logo Stroke, Shadow & Card Backing', desc: 'Custom outline stroke color, card badge shapes & drop shadow styling', icon: Paintbrush, defaultPlan: 'free' },
  { id: 'qr_logo_bg_remover', name: 'AI Logo Background Remover & Crop', desc: 'Automatic 1-click AI transparency cutout and square/circle image cropper', icon: Eraser, defaultPlan: 'weekly' },
  { id: 'qr_color_texture', name: 'Logo Texture Overlay & Cards', desc: 'Apply brand texture pattern overlays and contrast card frames', icon: Layers, defaultPlan: 'weekly' }
];

export const ALL_TEXT_CONTROLS = [
  { id: 'qr_center_text', name: 'Center Text Watermark Embed', desc: 'Custom text banner embedded directly inside the QR code center', icon: Type, defaultPlan: 'weekly' },
  { id: 'qr_text_frame', name: 'CTA Frame Text (Top / Bottom)', desc: 'Call to action text rendered inside the frame badge header/footer', icon: LayoutGrid, defaultPlan: 'free' },
  { id: 'qr_text_transforms', name: 'Text Transforms (Size, Position, Rotate)', desc: 'Fine-grain scaling slider, 3x3 alignment positioning grid & 360-degree rotation', icon: Sliders, defaultPlan: 'free' },
  { id: 'qr_text_styling', name: 'Text Colors, Stroke & Drop Shadow', desc: 'Custom typography font colors, gradient fill, outline stroke & shadow glow', icon: Palette, defaultPlan: 'free' },
  { id: 'qr_custom_font_upload', name: 'Custom TTF / OTF Font Upload', desc: 'Upload proprietary brand font files directly to QR matrix', icon: UploadCloud, defaultPlan: 'weekly' },
  { id: 'qr_text_fonts', name: 'Google Fonts Typography Suite', desc: 'Master access switch for all 30 curated Google fonts', icon: Type, defaultPlan: 'free' }
];

export const ALL_TEXT_SHAPES = [
  { id: 'solid', name: 'Solid Box', desc: 'Solid filled container card badge' },
  { id: 'rounded', name: 'Rounded Box', desc: 'Soft curved corner card badge' },
  { id: 'pill', name: 'Pill Box', desc: 'Capsule stadium pill shape' },
  { id: 'outline', name: 'Outline Box', desc: 'Border outline neon box' },
  { id: 'underline', name: 'Underline Ribbon', desc: 'Lower text underline bar' },
  { id: 'ribbon', name: 'Badge Ribbon', desc: 'Decorative ribbon badge banner' },
  { id: 'glow', name: 'Glow Effect Card', desc: 'Ambient neon glow backing' },
  { id: 'brackets', name: 'Focus Brackets', desc: 'Corner camera focus brackets' },
  { id: 'hexagon', name: 'Hexagon Badge', desc: '6-sided cyber polygon shape' },
  { id: 'dots', name: 'Dotted Box', desc: 'Ticket perforated dotted outline' }
];

export const ALL_EXPORT_FORMATS = [
  { id: 'export_png', name: 'PNG Image Export', desc: 'Download high-res PNG image', icon: Image, defaultPlan: 'free' },
  { id: 'export_jpg', name: 'JPG Image Export', desc: 'Download compressed JPG image', icon: Image, defaultPlan: 'free' },
  { id: 'export_svg', name: 'SVG Vector Export', desc: 'Download scalable SVG vector file', icon: Box, defaultPlan: 'weekly' },
  { id: 'export_pdf', name: 'PDF Document Export', desc: 'Download print-ready A4 PDF', icon: FileText, defaultPlan: 'weekly' }
];

export const ALL_EXPORT_QUALITIES = [
  { id: 'export_quality_low', name: 'Quality: Low (512px)', desc: 'Export standard low resolution (512px)', icon: Sliders, defaultPlan: 'free' },
  { id: 'export_quality_medium', name: 'Quality: Normal (1024px)', desc: 'Export normal resolution (1024px)', icon: Sliders, defaultPlan: 'free' },
  { id: 'export_quality_hd', name: 'Quality: HD (2048px)', desc: 'Export crisp HD resolution (2048px)', icon: Sparkles, defaultPlan: 'weekly' },
  { id: 'export_quality_ultra', name: 'Quality: 4K Ultra (4096px)', desc: 'Export ultra 4K resolution (4096px)', icon: Crown, defaultPlan: 'weekly' },
  { id: 'export_native_share', name: 'Native OS Share Sheet', desc: 'Share file directly to social apps', icon: Share2, defaultPlan: 'free' }
];

export const ALL_GRADIENTS = [
  { id: 'sunset', name: 'Sunset Glow', from: '#FF512F', to: '#DD2476' },
  { id: 'ocean', name: 'Ocean Breeze', from: '#2193b0', to: '#6dd5ed' },
  { id: 'neon_night', name: 'Neon Night', from: '#00F0FF', to: '#7000FF' },
  { id: 'lush', name: 'Lush Forest', from: '#56ab2f', to: '#a8e063' },
  { id: 'midnight', name: 'Midnight Carbon', from: '#232526', to: '#414345' },
  { id: 'candy', name: 'Sweet Candy', from: '#ee9ca7', to: '#ffdde1' },
  { id: 'skyline', name: 'Skyline Blue', from: '#1488CC', to: '#2B32B2' },
  { id: 'royal', name: 'Royal Steel', from: '#16222A', to: '#3A6073' },
  { id: 'sunrise', name: 'Morning Sunrise', from: '#f12711', to: '#f5af19' },
  { id: 'purple_love', name: 'Purple Love', from: '#cc2b5e', to: '#753a88' },
  { id: 'deep_sea', name: 'Deep Sea Depth', from: '#2C3E50', to: '#4CA1AF' },
  { id: 'fire', name: 'Blazing Fire', from: '#f83600', to: '#f9d423' },
  { id: 'peach', name: 'Sweet Peach', from: '#ED4264', to: '#FFEDBC' },
  { id: 'violet', name: 'Neon Violet', from: '#7F00FF', to: '#E100FF' },
  { id: 'emerald', name: 'Emerald Clean', from: '#00b09b', to: '#96c93d' },
  { id: 'bora_bora', name: 'Bora Bora', from: '#2BC0E4', to: '#EAECC6' },
  { id: 'misty', name: 'Misty Blue', from: '#E0EAFC', to: '#CFDEF3' },
  { id: 'steel', name: 'Brushed Steel', from: '#1F1C2C', to: '#928DAB' },
  { id: 'juicy', name: 'Juicy Orange', from: '#FF8008', to: '#FFC837' },
  { id: 'pinky', name: 'Pinky Flare', from: '#DD5E89', to: '#F7BB97' },
  { id: 'seaweed', name: 'Seaweed Dark', from: '#4b6cb7', to: '#182848' },
  { id: 'cherry', name: 'Cherry Blossom', from: '#EB3349', to: '#F45C43' },
  { id: 'mojito', name: 'Fresh Mojito', from: '#48c6ef', to: '#6f86d6' },
  { id: 'aqua', name: 'Electric Aqua', from: '#00c6ff', to: '#0072ff' },
  { id: 'blueberry', name: 'Blueberry Pop', from: '#6a11cb', to: '#2575fc' },
  { id: 'bloody_mary', name: 'Bloody Mary', from: '#FF512F', to: '#DD2476' },
  { id: 'rose', name: 'Soft Rose', from: '#e91e63', to: '#ff8a80' },
  { id: 'gold', name: 'Metallic Gold', from: '#D4AF37', to: '#F9E29C' },
  { id: 'mint', name: 'Clean Mint', from: '#00b09b', to: '#96c93d' },
  { id: 'indigo_grad', name: 'Indigo Stream', from: '#396afc', to: '#2948ff' },
  { id: 'lime', name: 'Citrus Lime', from: '#a8ff78', to: '#78ffd6' },
  { id: 'flamingo', name: 'Flamingo Feather', from: '#ff4b2b', to: '#ff416c' },
  { id: 'galaxy', name: 'Cosmic Galaxy', from: '#240b36', to: '#c31432' },
  { id: 'space', name: 'Deep Space', from: '#0f0c29', to: '#302b63' },
  { id: 'cloudy', name: 'Cloudy Horizon', from: '#fdfbfb', to: '#ebedee' },
  { id: 'forest_grad', name: 'Deep Forest', from: '#5a3f37', to: '#2c7744' },
  { id: 'wine', name: 'Wine Velvet', from: '#af2d2d', to: '#631010' },
  { id: 'magic', name: 'Magic Spell', from: '#5f2c82', to: '#49a09d' },
  { id: 'plum', name: 'Soft Plum', from: '#ada996', to: '#f2f2f2' },
  { id: 'steel_blue', name: 'Steel Blue', from: '#3a7bd5', to: '#00d2ff' },
  { id: 'turquoise_grad', name: 'Turquoise Gem', from: '#136a8a', to: '#267871' },
  { id: 'venice', name: 'Venice Water', from: '#085078', to: '#85D8CE' },
  { id: 'horizon', name: 'Desert Horizon', from: '#003973', to: '#E5E5BE' },
  { id: 'electric', name: 'Electric Spark', from: '#6a11cb', to: '#2575fc' },
  { id: 'lava', name: 'Lava Stream', from: '#f12711', to: '#f5af19' },
  { id: 'toxic', name: 'Toxic Glow', from: '#11998e', to: '#38ef7d' },
  { id: 'citrus', name: 'Citrus Burst', from: '#FDC830', to: '#F37335' },
  { id: 'frost', name: 'Arctic Frost', from: '#000428', to: '#004e92' },
  { id: 'coal', name: 'Coal Carbon', from: '#000000', to: '#434343' },
  { id: 'titanium', name: 'Titanium Pure', from: '#283048', to: '#859398' }
];

export const ALL_BG_SHAPES = [
  { id: 'full', name: 'Full Canvas Backing', desc: 'Standard solid square canvas backing', defaultPlan: 'free' },
  { id: 'rounded', name: 'Rounded Box Card', desc: 'Curved rectangle card backing', defaultPlan: 'free' },
  { id: 'squircle', name: 'Squircle Box Backing', desc: 'Super-ellipse rounded backing', defaultPlan: 'weekly' },
  { id: 'cut', name: 'Cut / Beveled Shape', desc: 'Chamfered beveled polygon corner backing', defaultPlan: 'weekly' },
  { id: 'leaf', name: 'Organic Leaf Shape', desc: 'Botanical diagonal leaf contour', defaultPlan: 'weekly' },
  { id: 'circle', name: 'Circle Shield Badge', desc: 'Concentric circular badge backing', defaultPlan: 'weekly' },
  { id: 'shield', name: 'Security Knight Shield', desc: 'Defensive crest shield backing', defaultPlan: 'weekly' },
  { id: 'hexagon', name: 'Cyber Hexagon Badge', desc: '6-sided futuristic polygon backing', defaultPlan: 'weekly' },
  { id: 'octagon', name: 'Industrial Octagon', desc: '8-sided industrial octagon backing', defaultPlan: 'weekly' },
  { id: 'diamond', name: 'Precious Diamond', desc: '45-degree angled diamond backing', defaultPlan: 'weekly' }
];

export const ALL_FONTS = [
  { id: 'Outfit', name: 'Outfit', category: 'Geometric Sans' },
  { id: 'Inter', name: 'Inter', category: 'Clean Sans' },
  { id: 'Montserrat', name: 'Montserrat', category: 'Modern Sans' },
  { id: 'Playfair Display', name: 'Playfair Display', category: 'Luxury Serif' },
  { id: 'Oswald', name: 'Oswald', category: 'Condensed Display' },
  { id: 'Pacifico', name: 'Pacifico', category: 'Casual Script' },
  { id: 'Caveat', name: 'Caveat', category: 'Handwritten' },
  { id: 'Dancing Script', name: 'Dancing Script', category: 'Formal Script' },
  { id: 'Bebas Neue', name: 'Bebas Neue', category: 'Bold Impact' },
  { id: 'Lobster', name: 'Lobster', category: 'Retro Display' },
  { id: 'Roboto', name: 'Roboto', category: 'Standard Sans' },
  { id: 'Open Sans', name: 'Open Sans', category: 'Universal Sans' },
  { id: 'Lato', name: 'Lato', category: 'Warm Sans' },
  { id: 'Poppins', name: 'Poppins', category: 'Geometric Sans' },
  { id: 'Raleway', name: 'Raleway', category: 'Elegant Sans' },
  { id: 'Merriweather', name: 'Merriweather', category: 'Editorial Serif' },
  { id: 'Noto Sans', name: 'Noto Sans', category: 'Global Sans' },
  { id: 'Ubuntu', name: 'Ubuntu', category: 'Modern Tech' },
  { id: 'Anton', name: 'Anton', category: 'Heavy Display' },
  { id: 'Permanent Marker', name: 'Permanent Marker', category: 'Graffiti Street' },
  { id: 'Righteous', name: 'Righteous', category: 'Cyber Sci-Fi' },
  { id: 'Cinzel', name: 'Cinzel', category: 'Classic Roman' },
  { id: 'Courgette', name: 'Courgette', category: 'Italic Script' },
  { id: 'Fredoka One', name: 'Fredoka One', category: 'Playful Chunky' },
  { id: 'Great Vibes', name: 'Great Vibes', category: 'Wedding Calligraphy' },
  { id: 'Kanit', name: 'Kanit', category: 'Modern Geometric' },
  { id: 'Luckiest Guy', name: 'Luckiest Guy', category: 'Cartoon Bubble' },
  { id: 'Orbitron', name: 'Orbitron', category: 'Futuristic Sci-Fi' },
  { id: 'Quicksand', name: 'Quicksand', category: 'Soft Rounded' },
  { id: 'Satisfy', name: 'Satisfy', category: 'Signature Script' }
];

export const ALL_TEMPLATES = QR_TEMPLATES;

function getSampleMatrixDirect() {
  try {
    const qr = qrcode(0, 'H');
    qr.addData('https://mushiqr.pro');
    qr.make();
    const count = qr.getModuleCount();
    const matrix = [];
    for (let r = 0; r < count; r++) {
      matrix[r] = [];
      for (let c = 0; c < count; c++) {
        matrix[r][c] = qr.isDark(r, c);
      }
    }
    return { matrix, moduleCount: count };
  } catch {
    return null;
  }
}

function TemplateItemControlTile({ tpl, enabled, isPaid, updating, onToggleEnable, onToggleTier }) {
  const isOff = !enabled;
  const isDarkMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  return (
    <div style={{
      background: isOff ? (isDarkMode ? 'rgba(15, 18, 33, 0.4)' : '#F8FAFC') : 'var(--ad-input)',
      border: `1.5px solid ${isOff ? (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5') : (isPaid ? (isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#FCD34D') : (isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#6EE7B7'))}`,
      borderRadius: 14, padding: '10px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      gap: 8, opacity: isOff ? 0.65 : 1, transition: 'all 0.18s ease',
      boxShadow: isPaid ? '0 2px 8px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(16, 185, 129, 0.08)',
      boxSizing: 'border-box', minWidth: 0
    }}>
      {/* High Performance Viewport-Aware Cached Thumbnail */}
      <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>
        <TemplateCard template={tpl} />
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          fontSize: 11.5, fontWeight: 800, color: 'var(--ad-text)', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {tpl.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 2 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
            background: 'var(--ad-card)', color: 'var(--ad-text-sec)',
            border: '1px solid var(--ad-border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {tpl.category || 'Standard'}
          </span>
          <span style={{ fontSize: 8.5, color: 'var(--ad-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tpl.styleFamily || 'poster'}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar: Active Switch + 1-Click Free/Pro Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid var(--ad-border)', gap: 6
      }}>
        <button
          type="button"
          disabled={updating}
          onClick={onToggleEnable}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
            borderRadius: 7,
            border: `1.5px solid ${enabled ? (isDarkMode ? 'rgba(34, 197, 94, 0.45)' : '#86EFAC') : (isDarkMode ? 'rgba(239, 68, 68, 0.45)' : '#FCA5A5')}`,
            background: enabled ? (isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#F0FDF4') : (isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEF2F2'),
            color: enabled ? (isDarkMode ? '#4ADE80' : '#15803D') : (isDarkMode ? '#F87171' : '#B91C1C'),
            fontSize: 9.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0
          }}
        >
          <Power size={10} strokeWidth={2.5} />
          <span>{enabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          disabled={updating}
          onClick={onToggleTier}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
            borderRadius: 100, border: `1.5px solid ${isPaid ? '#F59E0B' : '#10B981'}`,
            background: isPaid ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF', fontSize: 9.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0,
            boxShadow: isPaid ? '0 2px 6px rgba(245, 158, 11, 0.35)' : '0 2px 6px rgba(16, 185, 129, 0.35)'
          }}
        >
          {updating ? (
            <RefreshCw size={10} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isPaid ? (
            <Crown size={10} fill="#fff" color="#fff" strokeWidth={2.2} />
          ) : (
            <Shield size={10} strokeWidth={2.5} />
          )}
          <span>{isPaid ? 'PRO' : 'FREE'}</span>
        </button>
      </div>
    </div>
  );
}

// ─── MINI CANVAS RENDERERS ──────────────────────────────────────────────────

function MiniDotCanvas({ dotStyle, color = '#D60036' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 64;
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // 5x5 grid preview with center eye
    const gridCount = 5;
    const padding = 2;
    const availableSize = size - padding * 2;
    const cellSize = availableSize / gridCount;

    const matrix = [
      [1, 0, 1, 0, 1],
      [0, 1, 1, 1, 0],
      [1, 1, 0, 1, 1],
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 1]
    ];

    ctx.fillStyle = color;

    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        if (!matrix[r][c]) continue;
        const x = padding + c * cellSize;
        const y = padding + r * cellSize;
        const neighbors = {
          top: r > 0 && !!matrix[r - 1][c],
          bottom: r < gridCount - 1 && !!matrix[r + 1][c],
          left: c > 0 && !!matrix[r][c - 1],
          right: c < gridCount - 1 && !!matrix[r][c + 1]
        };
        try {
          drawDotModule(ctx, x, y, cellSize, dotStyle, neighbors, {}, r, c);
        } catch {
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }, [dotStyle, color]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: '1px solid var(--ad-border)',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}

function MiniEyeCanvas({ eyeStyle, color = '#D60036' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 64;
    ctx.clearRect(0, 0, size, size);

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    const padding = 3;
    const eyeSize = size - padding * 2;
    try {
      drawEye(ctx, padding, padding, eyeSize, eyeStyle, color, color);
    } catch {
      ctx.fillStyle = color;
      ctx.fillRect(padding, padding, eyeSize, eyeSize);
    }
  }, [eyeStyle, color]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: '1px solid var(--ad-border)',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}

// ─── SHAPE THUMBNAIL RENDERER (Matching Mushi QR Pro App.jsx) ──────────────
export const renderShapeThumbnail = (shapeId, color = '#D60036') => {
  switch (shapeId) {
    case 'full':
    case 'solid':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <rect x="5" y="5" width="44" height="44" fill={color} />
        </svg>
      );
    case 'rounded':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <rect x="5" y="5" width="44" height="44" rx="12" fill={color} />
        </svg>
      );
    case 'squircle':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <rect x="5" y="5" width="44" height="44" rx="18" fill={color} />
        </svg>
      );
    case 'cut':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <polygon points="12,5 42,5 49,12 49,42 42,49 12,49 5,42 5,12" fill={color} />
        </svg>
      );
    case 'leaf':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <path d="M5,22 C5,10 15,5 27,5 L49,5 L49,32 C49,44 39,49 27,49 L5,49 Z" fill={color} />
        </svg>
      );
    case 'circle':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <circle cx="27" cy="27" r="22" fill={color} />
        </svg>
      );
    case 'shield':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <path d="M7,7 L47,7 L47,30 C47,42 27,48 27,48 C27,48 7,42 7,30 Z" fill={color} />
        </svg>
      );
    case 'hexagon':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <polygon points="14,6 40,6 50,27 40,48 14,48 4,27" fill={color} />
        </svg>
      );
    case 'octagon':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <polygon points="16,5 38,5 49,16 49,38 38,49 16,49 5,38 5,16" fill={color} />
        </svg>
      );
    case 'diamond':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <polygon points="27,4 50,27 27,50 4,27" fill={color} />
        </svg>
      );
    case 'pill':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <rect x="4" y="12" width="46" height="30" rx="15" fill={color} />
        </svg>
      );
    case 'ribbon':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <path d="M5,10 L49,10 L43,27 L49,44 L5,44 L11,27 Z" fill={color} />
        </svg>
      );
    case 'glow':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <defs>
            <filter id="glow-thumb-admin" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect x="8" y="8" width="38" height="38" rx="8" fill={color} filter="url(#glow-thumb-admin)" />
        </svg>
      );
    case 'brackets':
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <path d="M12 18 V12 H18 M36 12 H42 V18 M42 36 V42 H36 M18 42 H12 V36" stroke={color} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg width="36" height="36" viewBox="0 0 54 54" style={{ display: 'block' }}>
          <rect x="7" y="7" width="40" height="40" rx="8" fill={color} />
        </svg>
      );
  }
};

// ─── CUSTOM SVG ICONS (Matching Mushi QR Pro Generator) ────────────────────
export const QRDotsIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="mushi-pro-wide-dots">
    <path d="M12 4 L13 8.5 L17.5 9.5 L13 10.5 L12 15 L11 10.5 L6.5 9.5 L11 8.5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
    <circle cx="6.5" cy="15.5" r="3" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <circle cx="17.5" cy="15.5" r="3" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
  </svg>
);

export const QREyesIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="qr-eye-heavy-bold">
    <path fillRule="evenodd" d="M3 7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7zm4-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7z" clipRule="evenodd" />
    <rect x="8" y="8" width="8" height="8" rx="1.5" />
  </svg>
);

export const QRStyleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mushi-qr-star-all-circles">
    <rect x="3" y="3" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="6.5" cy="6.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <rect x="14" y="3" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="17.5" cy="6.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <rect x="3" y="14" width="7" height="7" rx="1.5" style={{ fill: 'transparent' }} />
    <circle cx="6.5" cy="17.5" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <path d="M17 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <circle cx="15" cy="20" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
    <circle cx="19.5" cy="20" r="1.5" style={{ fill: 'currentColor', fillOpacity: 1, stroke: 'none' }} />
  </svg>
);

export const QRGradientIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="qr-icon-grad-admin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0.15" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="9" fill="url(#qr-icon-grad-admin)" />
  </svg>
);

export const QRBgIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="2 2 20 20" fill="currentColor" className="shape-square">
    <rect x="3" y="3" width="18" height="18" rx="4" style={{ fill: 'currentColor', fillOpacity: 1 }} />
  </svg>
);

export const QRSizeIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-size-expand">
    <path d="M15 3h6v6" />
    <path d="M21 3l-7 7" />
    <path d="M9 21H3v-6" />
    <path d="M3 21l7-7" />
  </svg>
);

export const ALL_STYLE_TOOLS = [
  { id: 'custom_dot_styles', name: 'Dots Module Shapes Tool', desc: 'Bottom toolbar button for 37 custom dot module styles', icon: QRDotsIcon, defaultPlan: 'weekly' },
  { id: 'custom_eye_styles', name: 'Eyes Corner Finder Tool', desc: 'Bottom toolbar button for 35 corner eye frame & pupil shapes', icon: QREyesIcon, defaultPlan: 'weekly' },
  { id: 'custom_background_shapes', name: 'Background Shapes Master Tool', desc: 'Bottom toolbar button for 10 custom card & shield backings', icon: QRBgIcon, defaultPlan: 'weekly' },
  { id: 'qr_size_custom', name: 'QR Code Size Scale Slider', desc: 'Adjust scaling percentage (20% to 100%) of QR matrix', icon: QRSizeIcon, defaultPlan: 'free' },
  { id: 'qr_canvas_positioning', name: 'Matrix 3x3 Position Grid', desc: '9-point alignment & fine-grain X/Y repositioning inside canvas', icon: Maximize, defaultPlan: 'free' }
];

// ─── ICON MAPPINGS FOR 18 CONTENT FORMATS ──────────────────────────────────
const QR_CONTENT_FORMAT_ICONS = {
  qr_text: FileText,
  qr_url: Globe,
  qr_wifi: Wifi,
  qr_email: Mail,
  qr_phone: Phone,
  qr_sms: MessageSquare,
  qr_vcard: User,
  qr_location: MapPin,
  qr_pdf: FileText,
  qr_image: Image,
  qr_audio: Music,
  qr_document: FileSpreadsheet,
  qr_event: Calendar,
  qr_crypto: DollarSign,
  qr_whatsapp: MessageCircle,
  qr_youtube: Video,
  qr_instagram: Image,
  qr_facebook: Globe,
  qr_x: Send,
  qr_linkedin: AtSign,
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function VisualQRControlStudio({ currentUser, isDark = false }) {
  const [liveFlagsMap, setLiveFlagsMap] = useState({});
  const [livePlans, setLivePlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('content');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [updatingKey, setUpdatingKey] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Real-time Firestore sync
  useEffect(() => {
    setLoading(true);
    const unsubGlobal = onSnapshot(doc(db, 'global_config', 'featureFlags'), snap => {
      if (snap.exists()) setLiveFlagsMap(snap.data() || {});
      setLoading(false);
    }, () => setLoading(false));

    const unsubPlans = onSnapshot(collection(db, 'subscription_plans'), colSnap => {
      const plans = {};
      colSnap.forEach(d => { plans[d.id] = d.data(); });
      setLivePlans(plans);
    }, () => {});

    return () => {
      unsubGlobal?.();
      unsubPlans?.();
    };
  }, []);

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const getItemState = (key, defaultEnabled = true, defaultPlan = 'free') => {
    const enabled = liveFlagsMap[key] !== undefined ? Boolean(liveFlagsMap[key]) : defaultEnabled;
    let isPaid = false;
    if (Array.isArray(livePlans.free?.features)) {
      isPaid = !livePlans.free.features.includes(key);
    } else {
      isPaid = defaultPlan !== 'free';
    }
    return { enabled, isPaid };
  };

  const handleToggleEnable = async (key, name, subcategory = 'Presets') => {
    setUpdatingKey(key);
    const current = getItemState(key).enabled;
    const nextState = !current;
    try {
      await setFeatureFlagCloud(key, nextState, { name, category: 'QR_GENERATOR', subcategory });
      setLiveFlagsMap(prev => ({ ...prev, [key]: nextState }));
      showToast(`${name} is now ${nextState ? '🟢 ENABLED (Visible)' : '🔴 DISABLED (Hidden)'}`);
    } catch (e) {
      showToast('❌ Update failed');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleToggleTier = async (key, name) => {
    setUpdatingKey(key);
    const currentPaid = getItemState(key).isPaid;
    const nextTier = currentPaid ? 'free' : 'paid';
    try {
      await setFeaturesTierBatchCloud([key], nextTier);
      showToast(`${name} is now ${nextTier === 'free' ? '🛡️ 100% FREE' : '👑 PAID PRO'}`);
    } catch (e) {
      showToast('❌ Tier update failed');
    } finally {
      setUpdatingKey(null);
    }
  };

  const handleBatchActiveTabTier = async (targetTier, keysList) => {
    setBulkProcessing(true);
    try {
      await setFeaturesTierBatchCloud(keysList, targetTier);
      showToast(`✨ ${keysList.length} items set to ${targetTier === 'free' ? 'FREE' : 'PRO'}`);
    } catch (e) {
      showToast('❌ Batch tier update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBatchActiveTabEnable = async (enable, itemsList, subcategory) => {
    setBulkProcessing(true);
    try {
      const updates = {};
      for (const item of itemsList) {
        updates[item.key] = Boolean(enable);
      }
      await setFeatureFlagsBatchCloud(updates, { category: 'QR_GENERATOR', subcategory });
      setLiveFlagsMap(prev => ({ ...prev, ...updates }));
      showToast(`✨ ${itemsList.length} items ${enable ? 'ENABLED' : 'DISABLED'}`);
    } catch (e) {
      showToast('❌ Batch update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  const canonicalQRFeatures = useMemo(() => {
    const raw = FEATURE_REGISTRY.filter(f => f.category === 'QR_GENERATOR');
    return raw.map(f => {
      const st = getItemState(f.featureId, f.defaultEnabled, f.defaultPlan);
      return { ...f, key: f.featureId, name: f.displayName, ...st };
    });
  }, [liveFlagsMap, livePlans]);

  // 7 Main Navbar Sub-Navigation Tabs
  const TABS = [
    { id: 'content', label: '1. Content', count: 18, icon: QrCode },
    { id: 'color', label: '2. Color', count: ALL_COLOR_THEME_PRESETS.length + ALL_GRADIENTS.length + ALL_TEXTURES.length + ALL_COLOR_TOOLS.length, icon: Palette },
    { id: 'style', label: '3. Style', count: ALL_DOT_STYLES.length + ALL_EYE_STYLES.length + ALL_BG_SHAPES.length + 6, icon: Grid },
    { id: 'logo', label: '4. Logo', count: ALL_LOGO_CONTROLS.length + ALL_LOGO_PRESETS.length, icon: Image },
    { id: 'template', label: '5. Template', count: ALL_TEMPLATES.length, icon: Sparkles },
    { id: 'text', label: '6. Text', count: ALL_TEXT_CONTROLS.length + ALL_TEXT_SHAPES.length + ALL_FONTS.length, icon: Type },
    { id: 'export', label: '7. Save & Export', count: ALL_EXPORT_FORMATS.length + ALL_EXPORT_QUALITIES.length, icon: Download }
  ];

  // Subcategory Tabs for each Main Category
  const SUB_TABS = useMemo(() => ({
    content: [
      { id: 'all', label: 'All', count: 18, icon: Layers },
      { id: 'formats', label: 'Content Formats', count: 18, icon: QrCode }
    ],
    color: [
      { id: 'all', label: 'All', count: ALL_COLOR_THEME_PRESETS.length + ALL_GRADIENTS.length + ALL_TEXTURES.length + ALL_COLOR_TOOLS.length, icon: Layers },
      { id: 'presets', label: 'Presets', count: ALL_COLOR_THEME_PRESETS.length + 2, icon: Bookmark },
      { id: 'gradients', label: 'Gradients', count: ALL_GRADIENTS.length + 1, icon: Wand2 },
      { id: 'dots', label: 'Dots', count: 6, icon: QRDotsIcon },
      { id: 'eyes', label: 'Eyes', count: 3, icon: QREyesIcon },
      { id: 'background', label: 'Background', count: 5, icon: Paintbrush },
      { id: 'image', label: 'Background Image', count: SOCIAL_TEXTURES.length + 4, icon: Image },
      { id: 'texture', label: 'Texture', count: ALL_TEXTURES.length + 3, icon: Layers }
    ],
    style: [
      { id: 'all', label: 'All', count: ALL_DOT_STYLES.length + ALL_EYE_STYLES.length + ALL_BG_SHAPES.length + 6, icon: Layers },
      { id: 'dots', label: 'Dots', count: ALL_DOT_STYLES.length + 1, icon: QRDotsIcon },
      { id: 'eyes', label: 'Eyes', count: ALL_EYE_STYLES.length + 1, icon: QREyesIcon },
      { id: 'background', label: 'Background Shapes', count: ALL_BG_SHAPES.length + 2, icon: QRBgIcon },
      { id: 'size', label: 'Size', count: 2, icon: QRSizeIcon },
      { id: 'position', label: 'Position', count: 2, icon: Maximize }
    ],
    logo: [
      { id: 'all', label: 'All', count: ALL_LOGO_CONTROLS.length + ALL_LOGO_PRESETS.length, icon: Layers },
      { id: 'controls', label: 'Controls', count: ALL_LOGO_CONTROLS.length, icon: Settings },
      { id: 'logos', label: 'Logos', count: ALL_LOGO_PRESETS.length, icon: Image }
    ],
    template: [
      { id: 'all', label: 'All', count: ALL_TEMPLATES.length, icon: Layers },
      { id: 'Scan Me Frames', label: 'Frames', count: ALL_TEMPLATES.filter(t => t.category === 'Scan Me Frames' || t.styleFamily === 'frame').length, icon: LayoutGrid },
      { id: 'vCard', label: 'vCard', count: ALL_TEMPLATES.filter(t => t.category === 'vCard' || t.styleFamily === 'vcard').length, icon: User },
      { id: 'Social Media', label: 'Social Media', count: ALL_TEMPLATES.filter(t => t.category === 'Social Media').length, icon: MessageCircle },
      { id: 'Business', label: 'Business', count: ALL_TEMPLATES.filter(t => t.category === 'Business').length, icon: FileSpreadsheet },
      { id: 'Communication', label: 'Communication', count: ALL_TEMPLATES.filter(t => t.category === 'Communication').length, icon: Mail },
      { id: 'Marketing', label: 'Marketing', count: ALL_TEMPLATES.filter(t => t.category === 'Marketing').length, icon: Sparkles },
      { id: 'Utility', label: 'Utility', count: ALL_TEMPLATES.filter(t => t.category === 'Utility').length, icon: SlidersHorizontal }
    ],
    text: [
      { id: 'all', label: 'All', count: ALL_TEXT_CONTROLS.length + ALL_TEXT_SHAPES.length + ALL_FONTS.length, icon: Layers },
      { id: 'capabilities', label: 'Capabilities', count: ALL_TEXT_CONTROLS.length, icon: Type },
      { id: 'shapes', label: 'Shapes', count: ALL_TEXT_SHAPES.length, icon: LayoutGrid },
      { id: 'fonts', label: 'Fonts', count: ALL_FONTS.length, icon: Type }
    ],
    export: [
      { id: 'all', label: 'All', count: ALL_EXPORT_FORMATS.length + ALL_EXPORT_QUALITIES.length, icon: Layers },
      { id: 'formats', label: 'Formats', count: ALL_EXPORT_FORMATS.length, icon: Download },
      { id: 'quality', label: 'Quality', count: ALL_EXPORT_QUALITIES.length, icon: Sliders }
    ]
  }), []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Feedback Toast */}
      {feedbackToast && (
        <div style={{
          position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15, 18, 33, 0.96)', border: '1.5px solid #D60036',
          borderRadius: 100, padding: '8px 18px', color: '#fff',
          fontSize: 12, fontWeight: 800, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          zIndex: 999999, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
        }}>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── Studio Header (Mobile-First UX) ──────────────────────────────────── */}
      <div style={{
        background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
        borderRadius: 16, padding: '14px', boxShadow: 'var(--ad-card-shadow)',
        display: 'flex', flexDirection: 'column', gap: 12
      }}>
        {/* Top: Icon + Title + Status Badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(214, 0, 54, 0.18) 0%, rgba(255, 77, 157, 0.15) 100%)',
            border: '1.5px solid rgba(214, 0, 54, 0.4)', color: '#D60036',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(214, 0, 54, 0.15)'
          }}>
            <QrCode size={22} strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ad-text)', margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                QR Generator Studio
              </h1>
              <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 100, background: 'rgba(214, 0, 54, 0.15)', color: '#D60036' }}>
                Live Assets
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--ad-text-sec)', margin: '3px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
              Granular Free/Pro controls for all 18 formats, 37 dot shapes, 35 eyes, textures, gradients, shapes, logos, fonts &amp; templates.
            </p>
          </div>
        </div>

        {/* Search Bar (100% Full Width on Mobile) */}
        <div style={{ width: '100%', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--ad-text-sec)' }} />
          <input
            type="text"
            placeholder="Search shapes, eyes, textures, logos, fonts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', background: 'var(--ad-input)', border: '1px solid var(--ad-border)',
              borderRadius: 9, padding: '8px 30px 8px 30px', color: 'var(--ad-text)',
              fontSize: 11.5, fontWeight: 600, outline: 'none', height: 36
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: 'var(--ad-text-sec)', cursor: 'pointer', padding: 2 }}>
              <XCircle size={14} />
            </button>
          )}
        </div>

        {/* Carousel Navigation Tabs (Main Category Pills) */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto',
          paddingBottom: 2, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
        }}>
          {TABS.map(t => {
            const isActive = activeTab === t.id;
            const IconC = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setActiveSubTab('all');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 12, border: 'none',
                  background: isActive ? '#D60036' : 'var(--ad-input)',
                  color: isActive ? '#FFFFFF' : 'var(--ad-text-sec)',
                  fontSize: 11.5, fontWeight: isActive ? 800 : 600, cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 4px 12px rgba(214, 0, 54, 0.35)' : 'none'
                }}
              >
                <IconC size={13} />
                <span>{t.label}</span>
                <span style={{
                  fontSize: 9, padding: '1px 6px', borderRadius: 10,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--ad-card)',
                  color: isActive ? '#fff' : 'var(--ad-text-sec)', fontWeight: 800
                }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subcategory Navigation Tabs (Consistent borderless pill style, 12px radius) */}
        {SUB_TABS[activeTab] && SUB_TABS[activeTab].length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto',
            paddingTop: 10, borderTop: '1px solid var(--ad-border)',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
          }}>
            {SUB_TABS[activeTab].map(st => {
              const isSubActive = activeSubTab === st.id;
              const SubIcon = st.icon;
              return (
                <button
                  key={st.id}
                  onClick={() => setActiveSubTab(st.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    borderRadius: 12, border: 'none',
                    background: isSubActive ? 'rgba(214, 0, 54, 0.18)' : 'var(--ad-input)',
                    color: isSubActive ? '#D60036' : 'var(--ad-text-sec)',
                    fontSize: 11, fontWeight: isSubActive ? 800 : 600, cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSubActive ? '0 2px 8px rgba(214, 0, 54, 0.2)' : 'none'
                  }}
                >
                  {SubIcon && <SubIcon size={12} />}
                  <span>{st.label}</span>
                  {st.count !== undefined && (
                    <span style={{
                      fontSize: 8.5, padding: '1px 6px', borderRadius: 10,
                      background: isSubActive ? '#D60036' : 'var(--ad-card)',
                      color: isSubActive ? '#fff' : 'var(--ad-text-sec)', fontWeight: 800
                    }}>
                      {st.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── TAB 1: CONTENT (Content Formats Toolbar) ─────────────────────────── */}
      {activeTab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(activeSubTab === 'all' || activeSubTab === 'formats') && (
            <SectionCatalog
              title="Content Formats"
              subtitle="The 18 content format cards shown to users on the creation screen."
              icon={QrCode}
              onMakeFree={() => handleBatchActiveTabTier('free', canonicalQRFeatures.filter(f => f.subcategory === 'Content' && f.key !== 'qr_tab_content').map(f => f.key))}
              onMakePro={() => handleBatchActiveTabTier('paid', canonicalQRFeatures.filter(f => f.subcategory === 'Content' && f.key !== 'qr_tab_content').map(f => f.key))}
              onEnableAll={() => handleBatchActiveTabEnable(true, canonicalQRFeatures.filter(f => f.subcategory === 'Content' && f.key !== 'qr_tab_content'), 'Content Formats')}
              onDisableAll={() => handleBatchActiveTabEnable(false, canonicalQRFeatures.filter(f => f.subcategory === 'Content' && f.key !== 'qr_tab_content'), 'Content Formats')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {canonicalQRFeatures
                  .filter(f => f.subcategory === 'Content' && f.key !== 'qr_tab_content' && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map(feature => {
                    const FormatIcon = QR_CONTENT_FORMAT_ICONS[feature.key] || FileText;
                    return (
                      <ItemControlTile
                        key={feature.key}
                        name={feature.name}
                        desc={feature.description}
                        enabled={feature.enabled}
                        isPaid={feature.isPaid}
                        icon={FormatIcon}
                        updating={updatingKey === feature.key}
                        onToggleEnable={() => handleToggleEnable(feature.key, feature.name, 'Content Formats')}
                        onToggleTier={() => handleToggleTier(feature.key, feature.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── TAB 2: COLOR (Presets, Dots, Eyes, BG Color, BG Image, Texture) ───── */}
      {activeTab === 'color' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subcategory 1: Presets Toolbar & Swatches (Solid 50 + Gradient 50) */}
          {(activeSubTab === 'all' || activeSubTab === 'presets') && (
            <SectionCatalog
              title="Presets"
              subtitle="Pre-designed high-contrast solid color palette swatches with 1-click Free/Pro & Active toggles."
              icon={Bookmark}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_presets', 'qr_color_presets_solid', ...ALL_COLOR_THEME_PRESETS.map(p => `qr_color_preset_${p.id}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_presets', 'qr_color_presets_solid', ...ALL_COLOR_THEME_PRESETS.map(p => `qr_color_preset_${p.id}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_presets', name: 'Color Presets Gallery Master' },
                { key: 'qr_color_presets_solid', name: 'Solid Color Presets' },
                ...ALL_COLOR_THEME_PRESETS.map(p => ({ key: `qr_color_preset_${p.id}`, name: p.name }))
              ], 'Presets')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_presets', name: 'Color Presets Gallery Master' },
                { key: 'qr_color_presets_solid', name: 'Solid Color Presets' },
                ...ALL_COLOR_THEME_PRESETS.map(p => ({ key: `qr_color_preset_${p.id}`, name: p.name }))
              ], 'Presets')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { key: 'qr_color_presets', name: 'Color Presets Gallery Master', desc: 'Master toolbar button to open the color presets drawer', defaultPlan: 'free', icon: Bookmark },
                  { key: 'qr_color_presets_solid', name: 'Solid Color Presets Tab', desc: 'Enable / disable the Solid presets tab in the generator', defaultPlan: 'free', icon: Palette }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Presets')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {ALL_COLOR_THEME_PRESETS
                  .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.includes(searchQuery.toLowerCase()))
                  .map(preset => {
                    const key = `qr_color_preset_${preset.id}`;
                    const state = getItemState(key, true, preset.id === 'classic' || preset.id === 'ocean' ? 'free' : 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={preset.name}
                        desc={preset.desc}
                        badge={preset.id}
                        customPreview={
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: preset.bg, border: '1.5px solid var(--ad-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: preset.qr }} />
                          </div>
                        }
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={Bookmark}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, preset.name, 'Presets')}
                        onToggleTier={() => handleToggleTier(key, preset.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 1.1: Gradient Presets (50 Gradients) */}
          {(activeSubTab === 'all' || activeSubTab === 'gradients') && (
            <SectionCatalog
              title="Dual Gradient Presets"
              subtitle="Trending multi-color dual linear and radial gradient presets for QR matrix and styling."
              icon={Wand2}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_presets_gradient', ...ALL_GRADIENTS.map(g => `qr_gradient_${g.id}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_presets_gradient', ...ALL_GRADIENTS.map(g => `qr_gradient_${g.id}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_presets_gradient', name: 'Gradient Presets Tab' },
                ...ALL_GRADIENTS.map(g => ({ key: `qr_gradient_${g.id}`, name: g.name }))
              ], 'Presets Gradient')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_presets_gradient', name: 'Gradient Presets Tab' },
                ...ALL_GRADIENTS.map(g => ({ key: `qr_gradient_${g.id}`, name: g.name }))
              ], 'Presets Gradient')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {(() => {
                  const state = getItemState('qr_color_presets_gradient', true, 'weekly');
                  return (
                    <ItemControlTile
                      key="qr_color_presets_gradient"
                      name="Gradient Presets Tab"
                      desc="Enable / disable the Gradient presets tab in the generator"
                      badge="qr_color_presets_gradient"
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Wand2}
                      updating={updatingKey === 'qr_color_presets_gradient'}
                      onToggleEnable={() => handleToggleEnable('qr_color_presets_gradient', 'Gradient Presets Tab', 'Presets Gradient')}
                      onToggleTier={() => handleToggleTier('qr_color_presets_gradient', 'Gradient Presets Tab')}
                    />
                  );
                })()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {ALL_GRADIENTS
                  .filter(g => !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.id.includes(searchQuery.toLowerCase()))
                  .map(grad => {
                    const key = `qr_gradient_${grad.id}`;
                    const state = getItemState(key, true, 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={grad.name}
                        desc={`${grad.from} → ${grad.to}`}
                        badge={grad.id}
                        customPreview={
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`, border: '1.5px solid var(--ad-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', flexShrink: 0 }} />
                        }
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={Wand2}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, grad.name, 'Presets Gradient')}
                        onToggleTier={() => handleToggleTier(key, grad.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Dots Color Toolbar (Solid Swatches, Gradients & Manual Pickers) */}
          {(activeSubTab === 'all' || activeSubTab === 'dots') && (
            <SectionCatalog
              title="Dots"
              subtitle="Granular control for solid swatches, dual gradient tools and custom RGB/Hex color pickers."
              icon={QRDotsIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_dots', 'qr_color_dots_solid', 'qr_color_dots_gradient', 'qr_color_dots_picker', 'custom_colors_solid', 'custom_colors_gradient'])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_dots', 'qr_color_dots_solid', 'qr_color_dots_gradient', 'qr_color_dots_picker', 'custom_colors_solid', 'custom_colors_gradient'])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_dots', name: 'Dots Color Tool Master' },
                { key: 'qr_color_dots_solid', name: 'Dots Solid Color Swatches' },
                { key: 'qr_color_dots_gradient', name: 'Dots Dual Gradient Fills' },
                { key: 'qr_color_dots_picker', name: 'Dots Advanced Color Picker' },
                { key: 'custom_colors_solid', name: 'Solid Color Pickers' },
                { key: 'custom_colors_gradient', name: 'Dual Gradient Color Fills' }
              ], 'Dots Color')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_dots', name: 'Dots Color Tool Master' },
                { key: 'qr_color_dots_solid', name: 'Dots Solid Color Swatches' },
                { key: 'qr_color_dots_gradient', name: 'Dots Dual Gradient Fills' },
                { key: 'qr_color_dots_picker', name: 'Dots Advanced Color Picker' },
                { key: 'custom_colors_solid', name: 'Solid Color Pickers' },
                { key: 'custom_colors_gradient', name: 'Dual Gradient Color Fills' }
              ], 'Dots Color')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {[
                  { key: 'qr_color_dots', name: 'Dots Color Master Tool', desc: 'Bottom toolbar module for adjusting QR dots color & gradient', defaultPlan: 'free', icon: QRDotsIcon },
                  { key: 'qr_color_dots_solid', name: 'Dots: Solid Color Swatches', desc: 'Quick 16 solid color swatches grid for dot modules', defaultPlan: 'free', icon: Palette },
                  { key: 'qr_color_dots_gradient', name: 'Dots: Gradient Dual Fills', desc: 'Dual gradient color sliders & connecting track tool for dots', defaultPlan: 'weekly', icon: Wand2 },
                  { key: 'qr_color_dots_picker', name: 'Dots: Advanced Eyedropper & Picker', desc: 'RGB, HSB & hex eyedropper pipette manual color picker', defaultPlan: 'free', icon: Paintbrush },
                  { key: 'custom_colors_solid', name: 'Solid Color Pickers (RGB/HSB)', desc: 'Advanced RGB/HSB solid color pickers', defaultPlan: 'free', icon: Palette },
                  { key: 'custom_colors_gradient', name: 'Dual Gradient Color Fills', desc: 'Linear & radial gradient QR color fills', defaultPlan: 'weekly', icon: Wand2 }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Dots Color')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 3: Eyes Color Toolbar */}
          {(activeSubTab === 'all' || activeSubTab === 'eyes') && (
            <SectionCatalog
              title="Eyes"
              subtitle="Independent color tuning for finder corner eye frame & inner pupil, plus dot sync."
              icon={QREyesIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_eyes', 'qr_color_eyes_custom', 'qr_color_eyes_sync'])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_eyes', 'qr_color_eyes_custom', 'qr_color_eyes_sync'])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_eyes', name: 'Eyes Color Tool Master' },
                { key: 'qr_color_eyes_custom', name: 'Custom Eye Finder Colors' },
                { key: 'qr_color_eyes_sync', name: 'Sync Eyes with Dots' }
              ], 'Eyes Color')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_eyes', name: 'Eyes Color Tool Master' },
                { key: 'qr_color_eyes_custom', name: 'Custom Eye Finder Colors' },
                { key: 'qr_color_eyes_sync', name: 'Sync Eyes with Dots' }
              ], 'Eyes Color')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {[
                  { key: 'qr_color_eyes', name: 'Eyes Color Master Tool', desc: 'Bottom toolbar button for finder eyes color customization', defaultPlan: 'free', icon: QREyesIcon },
                  { key: 'qr_color_eyes_custom', name: 'Independent Inner & Outer Colors', desc: 'Dual pickers for independent outer frame & inner pupil tuning', defaultPlan: 'free', icon: EyeOff },
                  { key: 'qr_color_eyes_sync', name: 'Sync Eyes with Dots Toggle', desc: 'One-click toggle to lock finder eye colors to dot matrix color', defaultPlan: 'free', icon: RefreshCw }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Eyes Color')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 4: BG Color Toolbar (Solid, Gradient, Picker & Transparency) */}
          {(activeSubTab === 'all' || activeSubTab === 'background') && (
            <SectionCatalog
              title="Background"
              subtitle="Canvas background color pickers, dual gradient fills and transparent canvas export support."
              icon={Paintbrush}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_bg', 'qr_color_bg_solid', 'qr_color_bg_gradient', 'qr_color_bg_picker', 'qr_color_bg_transparency'])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_bg', 'qr_color_bg_solid', 'qr_color_bg_gradient', 'qr_color_bg_picker', 'qr_color_bg_transparency'])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_bg', name: 'Background Color Master' },
                { key: 'qr_color_bg_solid', name: 'BG Solid Swatches' },
                { key: 'qr_color_bg_gradient', name: 'BG Gradient Fills' },
                { key: 'qr_color_bg_picker', name: 'BG Color Picker' },
                { key: 'qr_color_bg_transparency', name: 'BG Transparent Alpha' }
              ], 'BG Color')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_bg', name: 'Background Color Master' },
                { key: 'qr_color_bg_solid', name: 'BG Solid Swatches' },
                { key: 'qr_color_bg_gradient', name: 'BG Gradient Fills' },
                { key: 'qr_color_bg_picker', name: 'BG Color Picker' },
                { key: 'qr_color_bg_transparency', name: 'BG Transparent Alpha' }
              ], 'BG Color')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {[
                  { key: 'qr_color_bg', name: 'Background Color Master Tool', desc: 'Bottom toolbar button for adjusting QR canvas background color', defaultPlan: 'free', icon: Paintbrush },
                  { key: 'qr_color_bg_solid', name: 'BG: Solid Color Swatches', desc: 'Solid color swatches for quick background application', defaultPlan: 'free', icon: Grid },
                  { key: 'qr_color_bg_gradient', name: 'BG: Gradient Fills', desc: 'Linear & radial dual gradient canvas background fills', defaultPlan: 'weekly', icon: Wand2 },
                  { key: 'qr_color_bg_picker', name: 'BG: Advanced Color Picker', desc: 'Eyedropper and hex/RGB color picker for background', defaultPlan: 'free', icon: Paintbrush },
                  { key: 'qr_color_bg_transparency', name: 'BG: Transparent Alpha Export', desc: 'Export QR code with 100% transparent PNG/SVG background', defaultPlan: 'free', icon: Box }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'BG Color')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 5: BG Image Toolbar (Presets & Custom Upload) */}
          {(activeSubTab === 'all' || activeSubTab === 'image') && (
            <SectionCatalog
              title="Background Image"
              subtitle="Pre-designed background images, custom photo upload, dimming overlay and container card."
              icon={Image}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_bg_image', 'qr_bg_image_presets', 'qr_bg_image_upload', 'qr_bg_image_texture', ...SOCIAL_TEXTURES.map(t => `qr_bg_img_${t.slug}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_bg_image', 'qr_bg_image_presets', 'qr_bg_image_upload', 'qr_bg_image_texture', ...SOCIAL_TEXTURES.map(t => `qr_bg_img_${t.slug}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_bg_image', name: 'Background Image Master' },
                { key: 'qr_bg_image_presets', name: 'BG Image Presets Library' },
                { key: 'qr_bg_image_upload', name: 'Custom Photo Upload' },
                { key: 'qr_bg_image_texture', name: 'Dimming Overlay & Card' },
                ...SOCIAL_TEXTURES.map(t => ({ key: `qr_bg_img_${t.slug}`, name: `${t.name} BG Preset` }))
              ], 'BG Image')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_bg_image', name: 'Background Image Master' },
                { key: 'qr_bg_image_presets', name: 'BG Image Presets Library' },
                { key: 'qr_bg_image_upload', name: 'Custom Photo Upload' },
                { key: 'qr_bg_image_texture', name: 'Dimming Overlay & Card' },
                ...SOCIAL_TEXTURES.map(t => ({ key: `qr_bg_img_${t.slug}`, name: `${t.name} BG Preset` }))
              ], 'BG Image')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { key: 'qr_color_bg_image', name: 'Background Image Master Tool', desc: 'Master toolbar button for background photo and presets', defaultPlan: 'weekly', icon: Image },
                  { key: 'qr_bg_image_upload', name: 'Custom Photo Upload Button', desc: 'Allow users to upload camera/gallery images as QR backgrounds', defaultPlan: 'weekly', icon: UploadCloud },
                  { key: 'qr_bg_image_presets', name: 'Background Presets Gallery', desc: 'Pre-installed high-definition background artwork presets', defaultPlan: 'free', icon: LayoutGrid },
                  { key: 'qr_bg_image_texture', name: 'Dimming Overlay & Card Protection', desc: 'Dimming opacity slider, blur slider and contrast container card', defaultPlan: 'weekly', icon: Shield }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'BG Image')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {SOCIAL_TEXTURES
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.slug.includes(searchQuery.toLowerCase()))
                  .map(tex => {
                    const key = `qr_bg_img_${tex.slug}`;
                    const state = getItemState(key, true, 'free');
                    return (
                      <ItemControlTile
                        key={key}
                        name={`${tex.name} BG`}
                        desc={`Pre-set ${tex.name} background art`}
                        imageUrl={tex.url}
                        badge={tex.slug}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={Image}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, `${tex.name} BG`, 'BG Image')}
                        onToggleTier={() => handleToggleTier(key, `${tex.name} BG`)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 6: Texture Toolbar (Social Presets & Upload) */}
          {(activeSubTab === 'all' || activeSubTab === 'texture') && (
            <SectionCatalog
              title="Texture"
              subtitle="WhatsApp, Instagram, TikTok, YouTube textures, custom pattern upload and eye synchronization."
              icon={Layers}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_color_texture', 'qr_texture_presets', 'qr_texture_upload', ...ALL_TEXTURES.map(t => `qr_texture_${t.slug}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_color_texture', 'qr_texture_presets', 'qr_texture_upload', ...ALL_TEXTURES.map(t => `qr_texture_${t.slug}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_color_texture', name: 'Texture Master Tool' },
                { key: 'qr_texture_presets', name: 'Texture Presets Library' },
                { key: 'qr_texture_upload', name: 'Custom Texture Upload' },
                ...ALL_TEXTURES.map(t => ({ key: `qr_texture_${t.slug}`, name: t.name }))
              ], 'Texture')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_color_texture', name: 'Texture Master Tool' },
                { key: 'qr_texture_presets', name: 'Texture Presets Library' },
                { key: 'qr_texture_upload', name: 'Custom Texture Upload' },
                ...ALL_TEXTURES.map(t => ({ key: `qr_texture_${t.slug}`, name: t.name }))
              ], 'Texture')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { key: 'qr_color_texture', name: 'Texture Master Tool', desc: 'Toolbar button for matrix texture and pattern masks', defaultPlan: 'weekly', icon: Layers },
                  { key: 'qr_texture_upload', name: 'Custom Pattern Upload', desc: 'Allow users to upload custom image files as matrix texture mask', defaultPlan: 'weekly', icon: UploadCloud },
                  { key: 'qr_texture_presets', name: 'Social Texture Presets Gallery', desc: 'Pre-designed social brand pattern textures', defaultPlan: 'weekly', icon: Layers }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Texture')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {ALL_TEXTURES
                  .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tex => {
                    const key = `qr_texture_${tex.slug}`;
                    const state = getItemState(key, true, 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={tex.name}
                        desc={tex.desc || 'Social texture overlay'}
                        imageUrl={tex.url}
                        badge={tex.slug}
                        color={tex.color}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={tex.isUpload ? UploadCloud : Brush}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, tex.name, 'Texture')}
                        onToggleTier={() => handleToggleTier(key, tex.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── TAB 3: STYLE (Dots, Eyes, Background, Size & Position) ─────────── */}
      {activeTab === 'style' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subcategory 1: Dots (37 Dot Shapes + Master Dots Tool) */}
          {(activeSubTab === 'all' || activeSubTab === 'dots') && (
            <SectionCatalog
              title="Dots"
              subtitle="Master dots tool and 37 live canvas module shapes. Click to toggle Free/Pro & Active state."
              icon={QRDotsIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['custom_dot_styles', ...ALL_DOT_STYLES.map(d => `qr_dot_${d.id}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['custom_dot_styles', ...ALL_DOT_STYLES.map(d => `qr_dot_${d.id}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'custom_dot_styles', name: 'Dots Module Master Tool' },
                ...ALL_DOT_STYLES.map(d => ({ key: `qr_dot_${d.id}`, name: d.name }))
              ], 'Dots')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'custom_dot_styles', name: 'Dots Module Master Tool' },
                ...ALL_DOT_STYLES.map(d => ({ key: `qr_dot_${d.id}`, name: d.name }))
              ], 'Dots')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {(() => {
                  const state = getItemState('custom_dot_styles', true, 'weekly');
                  return (
                    <ItemControlTile
                      key="custom_dot_styles"
                      name="Dots Module Shapes Master Tool"
                      desc="Bottom toolbar button for accessing 37 dot matrix modules"
                      badge="custom_dot_styles"
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={QRDotsIcon}
                      updating={updatingKey === 'custom_dot_styles'}
                      onToggleEnable={() => handleToggleEnable('custom_dot_styles', 'Dots Module Shapes Tool', 'Dots')}
                      onToggleTier={() => handleToggleTier('custom_dot_styles', 'Dots Module Shapes Tool')}
                    />
                  );
                })()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
                {ALL_DOT_STYLES
                  .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.includes(searchQuery.toLowerCase()))
                  .map(dot => {
                    const key = `qr_dot_${dot.id}`;
                    const state = getItemState(key, true, dot.id === 'denso' || dot.id === 'dots' || dot.id === 'rounded' ? 'free' : 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={dot.name}
                        desc={dot.desc}
                        badge={dot.id}
                        customPreview={<MiniDotCanvas dotStyle={dot.id} color={state.isPaid ? '#F59E0B' : '#10B981'} />}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={QRDotsIcon}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, dot.name, 'Dots')}
                        onToggleTier={() => handleToggleTier(key, dot.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Eyes (35 Eye Shapes + Master Eyes Tool) */}
          {(activeSubTab === 'all' || activeSubTab === 'eyes') && (
            <SectionCatalog
              title="Eyes"
              subtitle="Master eye finder tool and 35 live corner contours & pupils. Click to toggle Free/Pro & Active state."
              icon={QREyesIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['custom_eye_styles', ...ALL_EYE_STYLES.map(e => `qr_eye_${e.id}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['custom_eye_styles', ...ALL_EYE_STYLES.map(e => `qr_eye_${e.id}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'custom_eye_styles', name: 'Eyes Shape Master Tool' },
                ...ALL_EYE_STYLES.map(e => ({ key: `qr_eye_${e.id}`, name: e.name }))
              ], 'Eyes')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'custom_eye_styles', name: 'Eyes Shape Master Tool' },
                ...ALL_EYE_STYLES.map(e => ({ key: `qr_eye_${e.id}`, name: e.name }))
              ], 'Eyes')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {(() => {
                  const state = getItemState('custom_eye_styles', true, 'weekly');
                  return (
                    <ItemControlTile
                      key="custom_eye_styles"
                      name="Eyes Corner Finder Master Tool"
                      desc="Bottom toolbar button for accessing 35 eye corner finder styles"
                      badge="custom_eye_styles"
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={QREyesIcon}
                      updating={updatingKey === 'custom_eye_styles'}
                      onToggleEnable={() => handleToggleEnable('custom_eye_styles', 'Eyes Corner Finder Tool', 'Eyes')}
                      onToggleTier={() => handleToggleTier('custom_eye_styles', 'Eyes Corner Finder Tool')}
                    />
                  );
                })()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: 10 }}>
                {ALL_EYE_STYLES
                  .filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.includes(searchQuery.toLowerCase()))
                  .map(eye => {
                    const key = `qr_eye_${eye.id}`;
                    const state = getItemState(key, true, eye.id === 'square' || eye.id === 'rounded' || eye.id === 'circle' ? 'free' : 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={eye.name}
                        desc={eye.desc}
                        badge={eye.id}
                        customPreview={<MiniEyeCanvas eyeStyle={eye.id} color={state.isPaid ? '#F59E0B' : '#10B981'} />}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={QREyesIcon}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, eye.name, 'Eyes')}
                        onToggleTier={() => handleToggleTier(key, eye.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 3: Background (10 Background Shapes & Transparent Backing) */}
          {(activeSubTab === 'all' || activeSubTab === 'background') && (
            <SectionCatalog
              title="Background Shapes"
              subtitle="Full, Rounded Box, Squircle, Cut Beveled, Leaf, Circle, Shield, Hexagon, Octagon & Diamond Backings."
              icon={QRBgIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['custom_background_shapes', 'qr_bg_transparent', ...ALL_BG_SHAPES.map(s => `qr_bg_${s.id}`)])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['custom_background_shapes', 'qr_bg_transparent', ...ALL_BG_SHAPES.map(s => `qr_bg_${s.id}`)])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'custom_background_shapes', name: 'Background Shapes Master' },
                { key: 'qr_bg_transparent', name: 'Transparent Background Toggle' },
                ...ALL_BG_SHAPES.map(s => ({ key: `qr_bg_${s.id}`, name: s.name }))
              ], 'Background')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'custom_background_shapes', name: 'Background Shapes Master' },
                { key: 'qr_bg_transparent', name: 'Transparent Background Toggle' },
                ...ALL_BG_SHAPES.map(s => ({ key: `qr_bg_${s.id}`, name: s.name }))
              ], 'Background')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10, marginBottom: 12 }}>
                {[
                  { key: 'custom_background_shapes', name: 'Background Shapes Master Tool', desc: 'Bottom toolbar button for accessing 10 background backing shapes', defaultPlan: 'weekly', icon: QRBgIcon },
                  { key: 'qr_bg_transparent', name: 'Transparent Background Toggle', desc: 'Toggle 100% transparent canvas background in generator', defaultPlan: 'free', icon: Box }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Background')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {ALL_BG_SHAPES
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery.toLowerCase()))
                  .map(shape => {
                    const key = `qr_bg_${shape.id}`;
                    const state = getItemState(key, true, shape.defaultPlan || (shape.id === 'full' || shape.id === 'rounded' ? 'free' : 'weekly'));
                    const themeColor = state.isPaid ? '#F59E0B' : '#10B981';
                    return (
                      <ItemControlTile
                        key={key}
                        name={shape.name}
                        desc={shape.desc}
                        badge={key}
                        customPreview={
                          <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: state.isPaid ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                            border: `1.5px solid ${themeColor}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {renderShapeThumbnail(shape.id, themeColor)}
                          </div>
                        }
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={QRBgIcon}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, shape.name, 'Background')}
                        onToggleTier={() => handleToggleTier(key, shape.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 4: Size & Scale Controls */}
          {(activeSubTab === 'all' || activeSubTab === 'size') && (
            <SectionCatalog
              title="Size"
              subtitle="Custom scaling percentage from 20% to 100% and 1-click 100% reset action button."
              icon={QRSizeIcon}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_size_custom', 'qr_size_reset'])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_size_custom', 'qr_size_reset'])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_size_custom', name: 'QR Size Slider Master' },
                { key: 'qr_size_reset', name: 'Reset Size Button' }
              ], 'Size')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_size_custom', name: 'QR Size Slider Master' },
                { key: 'qr_size_reset', name: 'Reset Size Button' }
              ], 'Size')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {[
                  { key: 'qr_size_custom', name: 'QR Code Size Scale Tool', desc: 'Bottom toolbar button and interactive slider for matrix scale (20%–100%)', defaultPlan: 'free', icon: QRSizeIcon },
                  { key: 'qr_size_reset', name: 'Reset Size Action Button', desc: '1-click button to reset QR scale back to 100% default', defaultPlan: 'free', icon: RefreshCw }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Size')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 5: Positioning & Alignment Controls */}
          {(activeSubTab === 'all' || activeSubTab === 'position') && (
            <SectionCatalog
              title="Position"
              subtitle="9-point alignment matrix, custom X/Y positioning and 1-click center reset action."
              icon={Maximize}
              onMakeFree={() => handleBatchActiveTabTier('free', ['qr_canvas_positioning', 'qr_position_reset'])}
              onMakePro={() => handleBatchActiveTabTier('paid', ['qr_canvas_positioning', 'qr_position_reset'])}
              onEnableAll={() => handleBatchActiveTabEnable(true, [
                { key: 'qr_canvas_positioning', name: '3x3 Position Grid Tool' },
                { key: 'qr_position_reset', name: 'Reset Position Action' }
              ], 'Position')}
              onDisableAll={() => handleBatchActiveTabEnable(false, [
                { key: 'qr_canvas_positioning', name: '3x3 Position Grid Tool' },
                { key: 'qr_position_reset', name: 'Reset Position Action' }
              ], 'Position')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {[
                  { key: 'qr_canvas_positioning', name: 'Matrix 3x3 Position Tool', desc: 'Bottom toolbar button for 9-point positional alignment grid', defaultPlan: 'free', icon: Maximize },
                  { key: 'qr_position_reset', name: 'Reset Position Center Button', desc: '1-click action to reset QR matrix back to canvas center (0.5, 0.5)', defaultPlan: 'free', icon: RefreshCw }
                ].map(item => {
                  const state = getItemState(item.key, true, item.defaultPlan);
                  const Icon = item.icon;
                  return (
                    <ItemControlTile
                      key={item.key}
                      name={item.name}
                      desc={item.desc}
                      badge={item.key}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.key}
                      onToggleEnable={() => handleToggleEnable(item.key, item.name, 'Position')}
                      onToggleTier={() => handleToggleTier(item.key, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── TAB 4: LOGO (Upload, AI Remover, Cards & 40 Brand Logos) ─────────── */}
      {activeTab === 'logo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subcategory 1: Logo Tools & Upload Controls */}
          {(activeSubTab === 'all' || activeSubTab === 'controls') && (
            <SectionCatalog
              title="Controls"
              subtitle="Branding controls including custom logo uploads, presets master, AI background removal and logo cards."
              icon={Image}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_LOGO_CONTROLS.map(c => c.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_LOGO_CONTROLS.map(c => c.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_LOGO_CONTROLS.map(c => ({ key: c.id, name: c.name })), 'Logo Controls')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_LOGO_CONTROLS.map(c => ({ key: c.id, name: c.name })), 'Logo Controls')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                {ALL_LOGO_CONTROLS.map(control => {
                  const state = getItemState(control.id, true, control.defaultPlan);
                  const Icon = control.icon;
                  return (
                    <ItemControlTile
                      key={control.id}
                      name={control.name}
                      desc={control.desc}
                      badge={control.id}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === control.id}
                      onToggleEnable={() => handleToggleEnable(control.id, control.name, 'Logo Controls')}
                      onToggleTier={() => handleToggleTier(control.id, control.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: 41 Brand Logos */}
          {(activeSubTab === 'all' || activeSubTab === 'logos') && (
            <SectionCatalog
              title="Logos"
              subtitle="Social icons, fintech logos, communication badges, and media brands."
              icon={Image}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_LOGO_PRESETS.map(l => `qr_logo_${l.slug}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_LOGO_PRESETS.map(l => `qr_logo_${l.slug}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_LOGO_PRESETS.map(l => ({ key: `qr_logo_${l.slug}`, name: l.name })), 'Brand Logos')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_LOGO_PRESETS.map(l => ({ key: `qr_logo_${l.slug}`, name: l.name })), 'Brand Logos')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {ALL_LOGO_PRESETS
                  .filter(l => !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.slug.includes(searchQuery.toLowerCase()))
                  .map(logo => {
                    const key = `qr_logo_${logo.slug}`;
                    const state = getItemState(key, true, 'free');
                    return (
                      <ItemControlTile
                        key={key}
                        name={logo.name}
                        desc={`Brand color: ${logo.color}`}
                        badge={logo.slug}
                        color={logo.color}
                        imageUrl={logo.url}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={Image}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, logo.name, 'Brand Logos')}
                        onToggleTier={() => handleToggleTier(key, logo.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── TAB 5: TEMPLATE (All 200+ Categorized Templates) ─────────────── */}
      {activeTab === 'template' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(() => {
            const currentCategoryTemplates = ALL_TEMPLATES.filter(t => {
              if (activeSubTab === 'all') return true;
              if (activeSubTab === 'Scan Me Frames') return t.category === 'Scan Me Frames' || t.styleFamily === 'frame';
              if (activeSubTab === 'vCard') return t.category === 'vCard' || t.styleFamily === 'vcard';
              return t.category === activeSubTab;
            });

            const filteredDisplayTemplates = currentCategoryTemplates.filter(t => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return (t.name || '').toLowerCase().includes(q) ||
                     (t.category || '').toLowerCase().includes(q) ||
                     (t.id || '').toLowerCase().includes(q);
            });

            const title = activeSubTab === 'all' ? 'All Templates' : `${activeSubTab} Templates`;
            const subtitle = `Manage access tier (Free vs Pro) and visibility for ${filteredDisplayTemplates.length} templates.`;

            return (
              <SectionCatalog
                title={title}
                subtitle={subtitle}
                icon={LayoutGrid}
                onMakeFree={() => handleBatchActiveTabTier('free', currentCategoryTemplates.map(t => `qr_template_${t.id}`))}
                onMakePro={() => handleBatchActiveTabTier('paid', currentCategoryTemplates.map(t => `qr_template_${t.id}`))}
                onEnableAll={() => handleBatchActiveTabEnable(true, currentCategoryTemplates.map(t => ({ key: `qr_template_${t.id}`, name: t.name })), 'Templates')}
                onDisableAll={() => handleBatchActiveTabEnable(false, currentCategoryTemplates.map(t => ({ key: `qr_template_${t.id}`, name: t.name })), 'Templates')}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                  {filteredDisplayTemplates.map(tpl => {
                    const key = `qr_template_${tpl.id}`;
                    const state = getItemState(key, true, 'free');
                    return (
                      <TemplateItemControlTile
                        key={key}
                        tpl={tpl}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, tpl.name, 'Templates')}
                        onToggleTier={() => handleToggleTier(key, tpl.name)}
                      />
                    );
                  })}
                </div>
              </SectionCatalog>
            );
          })()}
        </div>
      )}

      {/* ── TAB 6: TEXT (Controls, Shapes & 30 Google Fonts) ───────────────── */}
      {activeTab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subcategory 1: Text Tools & Feature Controls */}
          {(activeSubTab === 'all' || activeSubTab === 'capabilities') && (
            <SectionCatalog
              title="Capabilities"
              subtitle="Granular switches for Center Text, Frame Text, Typography Transforms, Outline Stroke & Shadow styling."
              icon={Type}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_TEXT_CONTROLS.map(c => c.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_TEXT_CONTROLS.map(c => c.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_TEXT_CONTROLS.map(c => ({ key: c.id, name: c.name })), 'Text Controls')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_TEXT_CONTROLS.map(c => ({ key: c.id, name: c.name })), 'Text Controls')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
                {ALL_TEXT_CONTROLS.map(control => {
                  const state = getItemState(control.id, true, control.defaultPlan);
                  const Icon = control.icon;
                  return (
                    <ItemControlTile
                      key={control.id}
                      name={control.name}
                      desc={control.desc}
                      badge={control.id}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === control.id}
                      onToggleEnable={() => handleToggleEnable(control.id, control.name, 'Text Controls')}
                      onToggleTier={() => handleToggleTier(control.id, control.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: 10 Text Shapes & Container Backings */}
          {(activeSubTab === 'all' || activeSubTab === 'shapes') && (
            <SectionCatalog
              title="Shapes"
              subtitle="Solid boxes, rounded cards, stadium pills, neon outline boxes, ribbons, glow effects and brackets."
              icon={LayoutGrid}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_TEXT_SHAPES.map(s => `qr_text_shape_${s.id}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_TEXT_SHAPES.map(s => `qr_text_shape_${s.id}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_TEXT_SHAPES.map(s => ({ key: `qr_text_shape_${s.id}`, name: s.name })), 'Text Shapes')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_TEXT_SHAPES.map(s => ({ key: `qr_text_shape_${s.id}`, name: s.name })), 'Text Shapes')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {ALL_TEXT_SHAPES
                  .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(shape => {
                    const key = `qr_text_shape_${shape.id}`;
                    const state = getItemState(key, true, shape.id === 'solid' || shape.id === 'rounded' ? 'free' : 'weekly');
                    return (
                      <ItemControlTile
                        key={key}
                        name={shape.name}
                        desc={shape.desc}
                        badge={shape.id}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={LayoutGrid}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, shape.name, 'Text Shapes')}
                        onToggleTier={() => handleToggleTier(key, shape.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 3: Fonts (30 Google Typography Fonts) */}
          {(activeSubTab === 'all' || activeSubTab === 'fonts') && (
            <SectionCatalog
              title="Fonts"
              subtitle="Outfit, Inter, Montserrat, Playfair Display, Pacifico, Orbitron, Bebas Neue, etc."
              icon={Type}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_FONTS.map(f => `qr_font_${f.id.toLowerCase().replace(/\s+/g, '_')}`))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_FONTS.map(f => `qr_font_${f.id.toLowerCase().replace(/\s+/g, '_')}`))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_FONTS.map(f => ({ key: `qr_font_${f.id.toLowerCase().replace(/\s+/g, '_')}`, name: f.name })), 'Fonts')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_FONTS.map(f => ({ key: `qr_font_${f.id.toLowerCase().replace(/\s+/g, '_')}`, name: f.name })), 'Fonts')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
                {ALL_FONTS
                  .filter(f => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.category.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(font => {
                    const key = `qr_font_${font.id.toLowerCase().replace(/\s+/g, '_')}`;
                    const state = getItemState(key, true, 'free');
                    return (
                      <ItemControlTile
                        key={key}
                        name={font.name}
                        desc={font.category}
                        fontFamily={font.id}
                        enabled={state.enabled}
                        isPaid={state.isPaid}
                        icon={Type}
                        updating={updatingKey === key}
                        onToggleEnable={() => handleToggleEnable(key, font.name, 'Fonts')}
                        onToggleTier={() => handleToggleTier(key, font.name)}
                      />
                    );
                  })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}

      {/* ── TAB 7: SAVE & EXPORT (Formats & Resolution Controls) ─────────────── */}
      {activeTab === 'export' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subcategory 1: Export Formats */}
          {(activeSubTab === 'all' || activeSubTab === 'formats') && (
            <SectionCatalog
              title="Formats"
              subtitle="PNG, JPG, Scalable Vector SVG, and Print-ready A4 PDF formats."
              icon={Download}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_EXPORT_FORMATS.map(f => f.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_EXPORT_FORMATS.map(f => f.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_EXPORT_FORMATS.map(f => ({ key: f.id, name: f.name })), 'Export Formats')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_EXPORT_FORMATS.map(f => ({ key: f.id, name: f.name })), 'Export Formats')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {ALL_EXPORT_FORMATS.map(item => {
                  const state = getItemState(item.id, true, item.defaultPlan);
                  const Icon = item.icon || Download;
                  return (
                    <ItemControlTile
                      key={item.id}
                      name={item.name}
                      desc={item.desc}
                      badge={item.id}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.id}
                      onToggleEnable={() => handleToggleEnable(item.id, item.name, 'Export Formats')}
                      onToggleTier={() => handleToggleTier(item.id, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}

          {/* Subcategory 2: Resolutions & OS Sharing */}
          {(activeSubTab === 'all' || activeSubTab === 'quality') && (
            <SectionCatalog
              title="Quality"
              subtitle="Manage export image resolutions (512px–4K Ultra) and OS social share sheet."
              icon={Sliders}
              onMakeFree={() => handleBatchActiveTabTier('free', ALL_EXPORT_QUALITIES.map(q => q.id))}
              onMakePro={() => handleBatchActiveTabTier('paid', ALL_EXPORT_QUALITIES.map(q => q.id))}
              onEnableAll={() => handleBatchActiveTabEnable(true, ALL_EXPORT_QUALITIES.map(q => ({ key: q.id, name: q.name })), 'Quality & Share')}
              onDisableAll={() => handleBatchActiveTabEnable(false, ALL_EXPORT_QUALITIES.map(q => ({ key: q.id, name: q.name })), 'Quality & Share')}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: 10 }}>
                {ALL_EXPORT_QUALITIES.map(item => {
                  const state = getItemState(item.id, true, item.defaultPlan);
                  const Icon = item.icon || Sliders;
                  return (
                    <ItemControlTile
                      key={item.id}
                      name={item.name}
                      desc={item.desc}
                      badge={item.id}
                      enabled={state.enabled}
                      isPaid={state.isPaid}
                      icon={Icon}
                      updating={updatingKey === item.id}
                      onToggleEnable={() => handleToggleEnable(item.id, item.name, 'Quality & Share')}
                      onToggleTier={() => handleToggleTier(item.id, item.name)}
                    />
                  );
                })}
              </div>
            </SectionCatalog>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// REUSABLE SUB-CONTAINER CARDS (Mobile-First UX)
// ═════════════════════════════════════════════════════════════════════════

function SectionCatalog({ title, subtitle, icon: Icon, onMakeFree, onMakePro, onEnableAll, onDisableAll, children }) {
  const isDarkMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  return (
    <div style={{
      background: 'var(--ad-card)', border: '1px solid var(--ad-border)',
      borderRadius: 18, padding: '14px 12px', boxShadow: 'var(--ad-card-shadow)',
      display: 'flex', flexDirection: 'column', gap: 14, width: '100%', boxSizing: 'border-box'
    }}>
      {/* Mobile-First Header with Title and Action Toolbar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%'
      }}>
        {/* Title and Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, width: '100%' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(214, 0, 54, 0.25) 0%, rgba(181, 0, 45, 0.2) 100%)',
            color: '#D60036',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(214, 0, 54, 0.25)'
          }}>
            <Icon size={18} strokeWidth={2.4} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: 'var(--ad-text)', margin: 0, lineHeight: 1.25, letterSpacing: '-0.2px' }}>
              {title}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--ad-text-sec)', margin: '2px 0 0', fontWeight: 500, lineHeight: 1.3 }}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Section Quick Batch Actions (Mobile-First 4-Pill Action Bar - Crystal Clear in Light & Dark Mode) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
          width: '100%',
          padding: '6px',
          background: 'var(--ad-input)',
          borderRadius: 12,
          border: '1px solid var(--ad-border)',
          boxSizing: 'border-box'
        }}>
          {/* 1. Free All Button */}
          <button
            type="button"
            onClick={onMakeFree}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '7px 4px', minHeight: 32,
              borderRadius: 10, border: 'none',
              background: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
              color: isDarkMode ? '#34D399' : '#047857',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Shield size={12} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>Free All</span>
          </button>

          {/* 2. Pro All Button */}
          <button
            type="button"
            onClick={onMakePro}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '7px 4px', minHeight: 32,
              borderRadius: 10, border: 'none',
              background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
              color: isDarkMode ? '#FBBF24' : '#B45309',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Crown size={12} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>Pro All</span>
          </button>

          {/* 3. Enable All Button */}
          <button
            type="button"
            onClick={onEnableAll}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '7px 4px', minHeight: 32,
              borderRadius: 10, border: 'none',
              background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4',
              color: isDarkMode ? '#4ADE80' : '#15803D',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Power size={12} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>Enable</span>
          </button>

          {/* 4. Hide / Disable All Button */}
          <button
            type="button"
            onClick={onDisableAll}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              padding: '7px 4px', minHeight: 32,
              borderRadius: 10, border: 'none',
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
              color: isDarkMode ? '#F87171' : '#B91C1C',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <XCircle size={12} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>Hide</span>
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

function ItemControlTile({ name, desc, badge, color, imageUrl, gradientFill, customPreview, fontFamily, enabled, isPaid, icon: Icon, updating, onToggleEnable, onToggleTier }) {
  const isOff = !enabled;
  const isDarkMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;

  return (
    <div style={{
      background: isOff
        ? (isDarkMode ? 'rgba(15, 18, 33, 0.4)' : '#F8FAFC')
        : (isPaid ? (isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB') : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF')),
      border: 'none',
      borderRadius: 14, padding: '11px 10px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      gap: 10, opacity: isOff ? 0.65 : 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isPaid ? '0 4px 14px rgba(245, 158, 11, 0.08)' : (isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'),
      boxSizing: 'border-box', minWidth: 0
    }}>
      {/* Top row: Visual Thumbnail + Name + Desc */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
        {customPreview ? (
          <div style={{ flexShrink: 0 }}>{customPreview}</div>
        ) : gradientFill ? (
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: gradientFill,
            border: 'none', flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }} />
        ) : imageUrl ? (
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: '#fff',
            border: 'none', padding: 4, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: isOff ? (isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9') : (isPaid ? (isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7') : (isDarkMode ? 'rgba(214, 0, 54, 0.12)' : 'rgba(214, 0, 54, 0.08)')),
            color: isOff ? 'var(--ad-text-sec)' : (isPaid ? '#F59E0B' : '#D60036'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {Icon && <Icon size={18} strokeWidth={2.4} />}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: 12, fontWeight: 800, color: 'var(--ad-text)', lineHeight: 1.3,
            fontFamily: fontFamily ? `${fontFamily}, sans-serif` : 'inherit',
            wordBreak: 'break-word', whiteSpace: 'normal'
          }}>
            {name}
          </div>
          {desc && (
            <div style={{
              fontSize: 10.5, color: 'var(--ad-text-sec)', marginTop: 3, lineHeight: 1.35,
              wordBreak: 'break-word', whiteSpace: 'normal'
            }}>
              {desc}
            </div>
          )}
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 6,
              background: 'var(--ad-card)', color: 'var(--ad-text-sec)',
              border: 'none', display: 'inline-block', marginTop: 4
            }}>
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar: Active Switch + 1-Click Free/Pro Toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: '1px solid var(--ad-border)', gap: 6
      }}>
        <button
          type="button"
          disabled={updating}
          onClick={onToggleEnable}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px',
            borderRadius: 8, border: 'none',
            background: enabled ? (isDarkMode ? 'rgba(34, 197, 94, 0.22)' : '#DCFCE7') : (isDarkMode ? 'rgba(239, 68, 68, 0.22)' : '#FEE2E2'),
            color: enabled ? (isDarkMode ? '#4ADE80' : '#15803D') : (isDarkMode ? '#F87171' : '#B91C1C'),
            fontSize: 9.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0
          }}
        >
          <Power size={10} strokeWidth={2.5} />
          <span>{enabled ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          disabled={updating}
          onClick={onToggleTier}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
            borderRadius: 100, border: 'none',
            background: isPaid ? '#F59E0B' : '#10B981',
            color: '#FFFFFF', fontSize: 9.5, fontWeight: 800,
            cursor: updating ? 'not-allowed' : 'pointer', flexShrink: 0,
            boxShadow: isPaid ? '0 2px 8px rgba(245, 158, 11, 0.35)' : '0 2px 8px rgba(16, 185, 129, 0.35)'
          }}
        >
          {updating ? (
            <RefreshCw size={10} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
          ) : isPaid ? (
            <Crown size={10} fill="#fff" color="#fff" strokeWidth={2.2} />
          ) : (
            <Shield size={10} strokeWidth={2.5} />
          )}
          <span>{isPaid ? 'PRO' : 'FREE'}</span>
        </button>
      </div>
    </div>
  );
}
