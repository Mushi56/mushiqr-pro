import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, CheckCircle2 } from 'lucide-react';

export default function LogoUpload({ logo, onLogoChange, onLogoRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onLogoChange({
          image: img,
          name: file.name,
          size: file.size,
          src: e.target.result,
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [onLogoChange]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  if (logo) {
    return (
      <div className="logo-upload-card active">
        <div className="logo-upload-preview">
          <div className="logo-img-wrapper">
            <img src={logo.src} alt="Logo" />
          </div>
          <div className="logo-info">
            <span className="logo-name">{logo.name}</span>
            <span className="logo-status">
              <CheckCircle2 size={12} color="var(--success)" /> Ready to use
            </span>
          </div>
          <button
            className="logo-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLogoRemove();
            }}
            title="Remove logo"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`logo-upload-card ${dragActive ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleChange}
        hidden
      />
      <div className="logo-upload-content">
        <div className="upload-icon-circle">
          <UploadCloud size={20} />
        </div>
        <div className="upload-text-group">
          <span className="main-text">Upload Custom Logo</span>
          <span className="sub-text">PNG, SVG or WEBP (Max 2MB)</span>
        </div>
      </div>
    </div>
  );
}
