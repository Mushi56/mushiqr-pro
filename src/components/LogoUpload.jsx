import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';

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

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (logo) {
    return (
      <div className="logo-upload-area has-logo">
        <div className="logo-preview-container">
          <img src={logo.src} alt="Logo" className="logo-preview-img" />
          <div className="logo-preview-info">
            <div className="logo-preview-name">{logo.name}</div>
            <div className="logo-preview-size">{formatSize(logo.size)}</div>
          </div>
          <button
            className="logo-remove-btn"
            onClick={(e) => {
              e.stopPropagation();
              onLogoRemove();
            }}
            title="Remove logo"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`logo-upload-area ${dragActive ? 'drag-active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={handleChange}
      />
      <span className="logo-upload-icon">
        <UploadCloud size={32} strokeWidth={1.5} color="var(--accent-primary)" />
      </span>
      <span className="logo-upload-text">Drop logo here or click to upload</span>
      <span className="logo-upload-hint">PNG recommended for perfect transparency</span>
    </div>
  );
}
