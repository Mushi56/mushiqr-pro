import { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { FeatureAccessManager } from '../services/FeatureAccessManager';
import PaidCrownBadge from './PaidCrownBadge';
import { usePremium } from '../services/premiumContext';
import { LOGO_PRESETS } from '../data/logoPresets';
import ImageCropShapeModal from './ImageCropShapeModal';

export default function LogoPresets({ logo, onLogoChange, onLogoRemove }) {
  const [loading, setLoading] = useState(null);
  const [cropModalData, setCropModalData] = useState(null); // { src, name, file }
  const [, setTick] = useState(0);
  const inputRef = useRef(null);
  const { showPaywall } = usePremium();

  useEffect(() => {
    const unsub = FeatureAccessManager.subscribe(() => setTick(t => t + 1));
    return () => unsub?.();
  }, []);

  const handleUploadClick = () => {
    if (logo && !LOGO_PRESETS.some(p => p.url === logo.src)) {
      onLogoRemove();
      return;
    }
    const access = FeatureAccessManager.canUseFeature('custom_logo_upload');
    if (!access.allowed) {
      showPaywall('custom_logo_upload');
      return;
    }
    inputRef.current?.click();
  };

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const access = FeatureAccessManager.canUseFeature('custom_logo_upload');
    if (!access.allowed) {
      showPaywall('custom_logo_upload');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropModalData({
        src: e.target.result,
        name: file.name,
        file
      });
    };
    reader.readAsDataURL(file);
  }, [showPaywall]);

  const handleCropConfirm = ({ image, src, name, shape }) => {
    onLogoChange({
      image,
      name,
      src,
      shape
    });
    setCropModalData(null);
  };

  const handleSelect = (slug, name, url) => {
    const featId = `qr_logo_${slug}`;
    const access = FeatureAccessManager.canUseFeature(featId);
    if (!access.allowed) {
      showPaywall(featId);
      return;
    }
    setLoading(slug);
    const img = new Image();
    img.onload = () => {
      onLogoChange({
        image: img,
        name,
        slug,
        src: url,
      });
      setLoading(null);
    };
    img.onerror = () => {
      setLoading(null);
    };
    img.src = url;
  };

  const visibleLogoPresets = LOGO_PRESETS.filter(p => {
    return FeatureAccessManager.isFeatureEnabled(`qr_logo_${p.slug}`);
  });

  return (
    <>
      <div className="logo-presets-container">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
            e.target.value = '';
          }}
          hidden
        />
        <div className="logo-presets-grid" style={{ opacity: logo?.locked ? 0.5 : 1, pointerEvents: logo?.locked ? 'none' : 'auto' }}>
          {/* Upload Tile */}
          {FeatureAccessManager.isFeatureEnabled('custom_logo_upload') && (
            <button
              className={`logo-preset-btn upload-tile ${logo && !LOGO_PRESETS.some(p => p.url === logo.src) ? 'active' : ''}`}
              onClick={handleUploadClick}
              title="Upload Custom Logo"
              style={{ background: 'var(--bg-elevated)', border: '2px dashed var(--border-light)', position: 'relative' }}
            >
              <PaidCrownBadge featureId="custom_logo_upload" position="corner" size={9} />
              {logo && !LOGO_PRESETS.some(p => p.url === logo.src) ? (
                <div className="logo-preset-icon" style={{ position: 'relative' }}>
                  <img src={logo.src} alt="Custom" style={{ opacity: logo?.locked ? 1 : 0.5 }} />
                  {!logo?.locked && <X size={16} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--error)' }} />}
                </div>
              ) : (
                <UploadCloud size={24} color="var(--accent-primary)" />
              )}
            </button>
          )}

          {visibleLogoPresets.map((p) => {
            const isPreStyled = p.hasContainer === true;
            return (
              <button
                key={p.slug}
                className={`logo-preset-btn ${loading === p.slug ? 'loading' : ''} ${logo?.src === p.url ? 'active' : ''}`}
                onClick={() => logo?.src === p.url ? onLogoRemove() : handleSelect(p.slug, p.name, p.url)}
                title={p.name}
                style={{
                  background: isPreStyled ? 'transparent' : '#FFFFFF',
                  borderRadius: '22.5%', // Authentic Apple iOS squircle radius
                  padding: isPreStyled ? '0' : '5px',
                  aspectRatio: '1 / 1',
                  boxShadow: isPreStyled ? 'none' : '0 3px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                  border: logo?.src === p.url ? '2px solid var(--accent-primary)' : (isPreStyled ? 'none' : '1px solid rgba(0,0,0,0.06)'),
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <PaidCrownBadge featureId={`qr_logo_${p.slug}`} fallbackFeatureId="custom_logo_presets" position="corner" size={9} />
                <div 
                  className="logo-preset-icon" 
                  style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img 
                    src={p.url} 
                    alt={p.name} 
                    loading="lazy" 
                    style={{ 
                      opacity: logo?.src === p.url ? 0.3 : 1, 
                      transition: 'opacity 0.2s',
                      width: '60%',
                      height: '60%',
                      maxWidth: '60%',
                      maxHeight: '60%',
                      aspectRatio: '1 / 1',
                      borderRadius: isPreStyled ? '22.5%' : '0',
                      objectFit: 'contain',
                      display: 'block',
                      margin: 'auto'
                    }} 
                  />
                  {logo?.src === p.url && (
                    <X size={18} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--accent-primary)', filter: 'none' }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {cropModalData && (
        <ImageCropShapeModal
          isOpen={Boolean(cropModalData)}
          imageSrc={cropModalData.src}
          imageName={cropModalData.name}
          title="Crop & Shape Logo"
          initialShape="rounded"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropModalData(null)}
        />
      )}
    </>
  );
}


