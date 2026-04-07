// PrivacyPolicy.jsx
// Add this file to your src/ folder in your project

export default function PrivacyPolicy() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.badge}>Legal</div>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.updated}>Last updated: April 7, 2026</p>

        <Section title="1. Introduction">
          Welcome to <strong>MushiQR Pro</strong>. We are committed to protecting
          your privacy. This Privacy Policy explains how we collect, use, and
          safeguard your information when you visit our website.
        </Section>

        <Section title="2. Information We Collect">
          We do <strong>not</strong> collect any personal information such as your
          name, email address, or phone number. The only data we collect is
          anonymous usage data through third-party services like Google AdSense
          and Google Analytics to help us understand how our website is used.
        </Section>

        <Section title="3. QR Code Data">
          Any text, URL, or information you enter to generate a QR code is
          processed entirely in your browser. We do <strong>not</strong> store,
          transmit, or share any data you enter into our QR code generator.
        </Section>

        <Section title="4. Cookies & Advertising">
          We use Google AdSense to display advertisements. Google may use cookies
          to show ads based on your prior visits to our website or other websites.
          You can opt out of personalized advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" style={styles.link}>
            Google Ads Settings
          </a>
          .
        </Section>

        <Section title="5. Third-Party Services">
          Our website may use the following third-party services:
          <ul style={styles.list}>
            <li>Google AdSense (advertising)</li>
            <li>Google Analytics (anonymous usage statistics)</li>
            <li>Vercel (website hosting)</li>
          </ul>
          Each of these services has their own privacy policy governing their use
          of data.
        </Section>

        <Section title="6. Children's Privacy">
          Our service is not directed to children under the age of 13. We do not
          knowingly collect personal information from children.
        </Section>

        <Section title="7. Changes to This Policy">
          We may update this Privacy Policy from time to time. Any changes will be
          posted on this page with an updated date.
        </Section>

        <Section title="8. Contact Us">
          If you have any questions about this Privacy Policy, please contact us
          at:{" "}
          <a href="mailto:contact@mushiqr-pro.com" style={styles.link}>
            contact@mushiqr-pro.com
          </a>
        </Section>
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
  list: {
    marginTop: "10px",
    paddingLeft: "20px",
    lineHeight: "2",
  },
  link: {
    color: "#818cf8",
    textDecoration: "none",
  },
};
