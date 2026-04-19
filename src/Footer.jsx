import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>© 2026 MushiQR Pro · All rights reserved</p>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Generator</Link>
        <span style={styles.dot}>·</span>
        <Link to="/about" style={styles.link}>About</Link>
        <span style={styles.dot}>·</span>
        <Link to="/privacy-policy" style={styles.link}>Privacy Policy</Link>
        <span style={styles.dot}>·</span>
        <Link to="/terms" style={styles.link}>Terms of Service</Link>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: 'rgba(0,0,0,0.3)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '20px',
    textAlign: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  text: {
    color: '#666',
    fontSize: '13px',
    margin: '0 0 8px',
  },
  links: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
  },
  link: {
    color: '#818cf8',
    textDecoration: 'none',
    fontSize: '13px',
  },
  dot: {
    color: '#444',
    fontSize: '13px',
  },
};
