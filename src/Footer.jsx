import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <p className="app-footer-text">© 2026 Mushi Qr Pro · All rights reserved</p>
      <div className="app-footer-links">
        <Link to="/" className="app-footer-link">Generator</Link>
        <span className="app-footer-dot">·</span>
        <Link to="/about" className="app-footer-link">About</Link>
        <span className="app-footer-dot">·</span>
        <Link to="/privacy-policy" className="app-footer-link">Privacy Policy</Link>
        <span className="app-footer-dot">·</span>
        <Link to="/terms" className="app-footer-link">Terms of Service</Link>
      </div>
    </footer>
  );
}
