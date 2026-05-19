import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>Legal</div>
        <h1 style={styles.title}>Terms of Service</h1>
        <p style={styles.updated}>Last updated: April 7, 2026</p>

        <Section title="1. Acceptance of Terms">
          By accessing and using Mushi Qr Pro, you accept and agree to be bound by the terms and provision of this agreement.
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
          In no event shall Mushi Qr Pro or its operators be liable for any indirect, incidental, special, consequential or punitive damages arising out of or related to your use of the service.
        </Section>

        <Section title="6. Contact Us">
          If you have any questions about these Terms, please contact us at:{" "}
          <a href="mailto:contact@mushiqr-pro.com" style={styles.link}>
            contact@mushiqr-pro.com
          </a>
        </Section>
        
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link to="/" style={styles.backLink}>
            <ArrowLeft size={16} /> Back to Generator
          </Link>
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
    background: "var(--bg-primary)",
    padding: "60px 20px",
    fontFamily: "var(--font-sans)",
  },
  card: {
    maxWidth: "800px",
    margin: "0 auto",
    background: "var(--bg-card)",
    backdropFilter: "blur(12px)",
    borderRadius: "24px",
    padding: "50px",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    boxShadow: "var(--shadow-md)",
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
    fontSize: "36px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: "0 0 8px 0",
  },
  updated: {
    fontSize: "13px",
    color: "var(--text-tertiary)",
    marginBottom: "40px",
  },
  section: {
    marginBottom: "32px",
    paddingBottom: "32px",
    borderBottom: "1px solid var(--border-light)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--accent-primary)",
    marginBottom: "12px",
    letterSpacing: "0.5px",
  },
  sectionText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "var(--text-secondary)",
    margin: 0,
  },
  link: {
    color: "var(--accent-primary)",
    textDecoration: "none",
    fontWeight: "600",
  },
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
