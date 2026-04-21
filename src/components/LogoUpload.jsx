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
      <div className="logo-compact-card-fixed active">
        <div className="logo-compact-preview-fixed">
          <div className="logo-thumb-fixed">
            <img src={logo.src} alt="Logo" />
          </div>
          <div className="logo-details-fixed">
            <span className="name">{logo.name}</span>
            <span className="status"><CheckCircle2 size={10} /> Active</span>
          </div>
          <button className="logo-delete-btn-fixed" onClick={onLogoRemove}>
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`logo-compact-upload-fixed ${dragActive ? 'drag-over' : ''}`}
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
      <div className="logo-compact-btn-content">
        <div className="btn-icon">
          <UploadCloud size={22} />
        </div>
        <div className="btn-text">
          <span className="top">Upload Custom Logo</span>
          <span className="bottom">PNG, SVG or WEBP</span>
        </div>
      </div>
    </div>
  );
}
