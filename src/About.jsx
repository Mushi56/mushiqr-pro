// About.jsx
// Add this file to your src/ folder in your project
import { Link } from 'react-router-dom';
import { Zap, Sliders, ShieldCheck, Smartphone, ArrowLeft } from 'lucide-react';

export default function About() {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.badge}>About Us</div>
        <h1 style={styles.title}>Mushi Qr Pro</h1>
        <p style={styles.subtitle}>
          The fastest, simplest, and most powerful free QR code generator on the web.
        </p>
      </div>

      <div style={styles.grid}>
        <FeatureCard icon={<Zap size={32} color="var(--accent-primary)" />} title="Instant Generation" desc="Generate QR codes in real-time as you type. No waiting, no delays." />
        <FeatureCard icon={<Sliders size={32} color="var(--accent-primary)" />} title="Fully Customizable" desc="Change colors, styles, and formats to match your brand." />
        <FeatureCard icon={<ShieldCheck size={32} color="var(--accent-primary)" />} title="100% Private" desc="Your data never leaves your browser. Nothing is stored on our servers." />
        <FeatureCard icon={<Smartphone size={32} color="var(--accent-primary)" />} title="Works Everywhere" desc="Optimized for mobile and desktop. Works on any device, any browser." />
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Our Mission</h2>
        <p style={styles.cardText}>
          Mushi Qr Pro was built with one goal: to give everyone access to a
          professional-grade QR code generator — completely free. Whether you're a
          small business owner, a student, or a developer, you deserve powerful
          tools without paying a subscription fee.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>How to Use</h2>
        <div style={styles.steps}>
          <Step num="1" text="Type your URL, text, or any content in the input box" />
          <Step num="2" text="Your QR code is generated instantly" />
          <Step num="3" text="Download it as PNG or SVG and use it anywhere" />
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Built with ❤️ by <strong>Mushi</strong> · Deployed on Vercel
        </p>
        <Link to="/privacy-policy" style={styles.link}>Privacy Policy</Link>
        <div style={{ marginTop: '20px' }}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={16} /> Back to Generator
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={styles.featureCard}>
      <div style={styles.icon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

function Step({ num, text }) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNum}>{num}</div>
      <p style={styles.stepText}>{text}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--bg-primary)",
    padding: "60px 20px",
    fontFamily: "var(--font-sans)",
    color: "var(--text-primary)",
  },
  hero: {
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 60px",
  },
  badge: {
    display: "inline-block",
    background: "var(--accent-soft)",
    color: "var(--accent-primary)",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    fontSize: "clamp(40px, 8vw, 56px)",
    fontWeight: "900",
    color: "var(--text-primary)",
    margin: "0 0 16px",
    background: "var(--accent-gradient)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "18px",
    color: "var(--text-secondary)",
    lineHeight: "1.7",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    maxWidth: "1000px",
    margin: "0 auto 40px",
  },
  featureCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "var(--shadow-sm)",
  },
  icon: { marginBottom: "16px", display: "flex", justifyContent: "center" },
  featureTitle: { fontSize: "18px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" },
  featureDesc: { fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 },
  card: {
    maxWidth: "800px",
    margin: "0 auto 30px",
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "40px",
    boxShadow: "var(--shadow-md)",
  },
  cardTitle: { fontSize: "24px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "20px" },
  cardText: { fontSize: "16px", lineHeight: "1.8", color: "var(--text-secondary)", margin: 0 },
  steps: { display: "flex", flexDirection: "column", gap: "20px" },
  step: { display: "flex", alignItems: "center", gap: "20px" },
  stepNum: {
    width: "40px", height: "40px", borderRadius: "50%",
    background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "800", fontSize: "16px", color: "#fff", flexShrink: 0,
    boxShadow: "var(--shadow-glow)",
  },
  stepText: { fontSize: "16px", color: "var(--text-secondary)", margin: 0, fontWeight: "500" },
  footer: { textAlign: "center", marginTop: "80px" },
  footerText: { color: "var(--text-tertiary)", fontSize: "14px", marginBottom: "16px" },
  link: { color: "var(--accent-primary)", textDecoration: "none", fontSize: "14px", fontWeight: "600" },
  backLink: {
    color: "var(--text-primary)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "12px 24px",
    background: "var(--bg-elevated)",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "background 0.2s",
    border: "1px solid var(--border-color)",
  }
};
