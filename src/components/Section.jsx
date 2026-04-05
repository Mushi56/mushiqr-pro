import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-title">
          {Icon && (
            <span className="section-icon">
              <Icon size={18} strokeWidth={2} />
            </span>
          )}
          {title}
        </div>
        <span className={`section-toggle ${open ? 'open' : ''}`}>
          <ChevronDown size={18} strokeWidth={2} />
        </span>
      </div>
      {open && <div className="section-content">{children}</div>}
    </div>
  );
}
