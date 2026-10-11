import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import { PremiumProvider } from './services/premiumContext.jsx';
import './index.css';

// Code-split heavy & secondary routes for faster initial load
const About = lazy(() => import('./About.jsx'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy.jsx'));
const Terms = lazy(() => import('./Terms.jsx'));

const RouteLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0B0F19',
    color: '#f0f0f8',
    fontFamily: 'Outfit, sans-serif'
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: '3px solid rgba(239, 30, 52, 0.2)',
        borderTopColor: '#EF1E34',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: 14, color: '#8b8fa8', letterSpacing: 0.5 }}>Loading Mushi QR Pro...</span>
    </div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <PremiumProvider>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/onboarding" element={<App />} />
            <Route path="/login" element={<App />} />
            <Route path="/signup" element={<App />} />
            <Route path="/forgot-password" element={<App />} />
            <Route path="/generator" element={<App />} />
            <Route path="/settings" element={<App />} />
            <Route path="/you" element={<App />} />
            <Route path="/saved" element={<App />} />
            <Route path="/history" element={<App />} />
            <Route path="/scanner" element={<App />} />
            <Route path="/batch" element={<App />} />
            <Route path="/barcode" element={<App />} />
            <Route path="/scanner-gun" element={<App />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </Suspense>
      </PremiumProvider>
    </HashRouter>
  </StrictMode>,
);

