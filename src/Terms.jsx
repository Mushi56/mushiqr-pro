import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>Legal</div>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: April 7, 2026</p>

        <Section title="1. Acceptance of Terms">
          By accessing and using MushiQR Pro, you accept and agree to be bound by the terms and provision of this agreement.
        </Section>

        <Section title="2. Use of Service">
          Our QR code generator is provided free of charge for both personal and commercial use. You agree not to use the service for any illegal or unauthorized purpose.
        </Section>

        <Section title="3. User Content">
          You are solely responsible for the content, URLs, and data you encode into QR codes using our service. We do not monitor, store, or verify the content of the QR codes generated.
        </Section>

        <Section title="4. Disclaimer of Warranties">
          The service is provided on an "as is" and "as available" basis without any warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free.
        </Section>

        <Section title="5. Limitation of Liability">
          In no event shall MushiQR Pro or its operators be liable for any indirect, incidental, special, consequential or punitive damages arising out of or related to your use of the service.
        </Section>

        <Section title="6. Contact Us">
          If you have any questions about these Terms, please contact us at:{" "}
          <a href="mailto:contact@mushiqr-pro.com" style={styles.link}>
            contact@mushiqr-pro.com
          </a>
        </Section>
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link to="/" style={styles.backLink}>← Back to Generator</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <p style={styles.sectionText}>{children}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    padding: "60px 20px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    maxWidth: "750px",
    margin: "0 auto",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    padding: "50px",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#e0e0e0",
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
    fontSize: "36px",
    fontWeight: "800",
    color: "#ffffff",
    margin: "0 0 8px 0",
  },
  updated: {
    fontSize: "13px",
    color: "#888",
    marginBottom: "40px",
  },
  section: {
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#a5b4fc",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  sectionText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#ccc",
    margin: 0,
  },
  link: {
    color: "#818cf8",
    textDecoration: "none",
  },
  backLink: {
    color: "#a5b4fc",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600",
    padding: "10px 20px",
    background: "rgba(99, 102, 241, 0.15)",
    borderRadius: "8px",
    display: "inline-block",
    transition: "background 0.2s",
  }
};
