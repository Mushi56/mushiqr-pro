// About.jsx
// Add this file to your src/ folder in your project

export default function About() {
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.badge}>About Us</div>
        <h1 style={styles.title}>MushiQR Pro</h1>
        <p style={styles.subtitle}>
          The fastest, simplest, and most powerful free QR code generator on the web.
        </p>
      </div>

      <div style={styles.grid}>
        <FeatureCard icon="⚡" title="Instant Generation" desc="Generate QR codes in real-time as you type. No waiting, no delays." />
        <FeatureCard icon="🎨" title="Fully Customizable" desc="Change colors, styles, and formats to match your brand." />
        <FeatureCard icon="🔒" title="100% Private" desc="Your data never leaves your browser. Nothing is stored on our servers." />
        <FeatureCard icon="📱" title="Works Everywhere" desc="Optimized for mobile and desktop. Works on any device, any browser." />
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Our Mission</h2>
        <p style={styles.cardText}>
          MushiQR Pro was built with one goal: to give everyone access to a
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
        <a href="/privacy-policy" style={styles.link}>Privacy Policy</a>
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
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    padding: "60px 20px",
    fontFamily: "'Segoe UI', sans-serif",
    color: "#e0e0e0",
  },
  hero: {
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 60px",
  },
  badge: {
    display: "inline-block",
    background: "rgba(99, 102, 241, 0.3)",
    color: "#a5b4fc",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "16px",
  },
  title: {
    fontSize: "52px",
    fontWeight: "900",
    color: "#ffffff",
    margin: "0 0 16px",
    background: "linear-gradient(90deg, #a5b4fc, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "18px",
    color: "#aaa",
    lineHeight: "1.7",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    maxWidth: "900px",
    margin: "0 auto 40px",
  },
  featureCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "28px",
    textAlign: "center",
  },
  icon: { fontSize: "32px", marginBottom: "12px" },
  featureTitle: { fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "8px" },
  featureDesc: { fontSize: "14px", color: "#999", lineHeight: "1.6", margin: 0 },
  card: {
    maxWidth: "750px",
    margin: "0 auto 30px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "36px",
  },
  cardTitle: { fontSize: "20px", fontWeight: "700", color: "#a5b4fc", marginBottom: "16px" },
  cardText: { fontSize: "15px", lineHeight: "1.8", color: "#ccc", margin: 0 },
  steps: { display: "flex", flexDirection: "column", gap: "16px" },
  step: { display: "flex", alignItems: "center", gap: "16px" },
  stepNum: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "800", fontSize: "14px", color: "#fff", flexShrink: 0,
  },
  stepText: { fontSize: "15px", color: "#ccc", margin: 0 },
  footer: { textAlign: "center", marginTop: "60px" },
  footerText: { color: "#666", fontSize: "14px", marginBottom: "12px" },
  link: { color: "#818cf8", textDecoration: "none", fontSize: "14px" },
};
