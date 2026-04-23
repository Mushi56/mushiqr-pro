import { 
  Link, 
  Type, 
  Wifi, 
  Mail, 
  Phone, 
  MessageSquare, 
  Contact,
  MapPin,
  FileText,
  File,
  Music,
  Image as ImageIcon,
  Coins,
  MessageCircle,
  Play,
  Calendar
} from 'lucide-react';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaXTwitter, 
  FaLinkedinIn 
} from 'react-icons/fa6';
import { QR_TYPES } from '../utils/qrEngine';

const TYPE_CONFIG = {
  [QR_TYPES.URL]: { icon: Link, label: 'URL' },
  [QR_TYPES.WIFI]: { icon: Wifi, label: 'WiFi' },
  [QR_TYPES.INSTAGRAM]: { icon: FaInstagram, label: 'Instagram' },
  [QR_TYPES.FACEBOOK]: { icon: FaFacebookF, label: 'Facebook' },
  [QR_TYPES.X]: { icon: FaXTwitter, label: 'X' },
  [QR_TYPES.LINKEDIN]: { icon: FaLinkedinIn, label: 'LinkedIn' },
  [QR_TYPES.WHATSAPP]: { icon: MessageCircle, label: 'WhatsApp' },
  [QR_TYPES.TEXT]: { icon: Type, label: 'Text' },
  [QR_TYPES.PHONE]: { icon: Phone, label: 'Phone' },
  [QR_TYPES.VCARD]: { icon: Contact, label: 'vCard' },
  [QR_TYPES.IMAGE]: { icon: ImageIcon, label: 'Image' },
  [QR_TYPES.PDF]: { icon: FileText, label: 'PDF' },
  [QR_TYPES.YOUTUBE]: { icon: Play, label: 'YouTube' },
  [QR_TYPES.EMAIL]: { icon: Mail, label: 'Email' },
  [QR_TYPES.SMS]: { icon: MessageSquare, label: 'SMS' },
  [QR_TYPES.LOCATION]: { icon: MapPin, label: 'Location' },
  [QR_TYPES.EVENT]: { icon: Calendar, label: 'Event' },
  [QR_TYPES.CRYPTO]: { icon: Coins, label: 'Crypto' },
  [QR_TYPES.AUDIO]: { icon: Music, label: 'Audio' },
  [QR_TYPES.DOCUMENT]: { icon: File, label: 'Document' },
};

export default function QRTypeSelector({ activeType, onTypeChange }) {
  return (
    <div className="type-tabs">
      {Object.entries(TYPE_CONFIG).map(([type, config]) => {
        const Icon = config.icon;
        return (
          <button
            key={type}
            className={`type-tab ${activeType === type ? 'active' : ''}`}
            onClick={() => onTypeChange(type)}
          >
            <span className="type-tab-icon">
              <Icon size={22} strokeWidth={1.5} />
            </span>
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
