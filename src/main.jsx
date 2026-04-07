import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import About from './About.jsx';
import PrivacyPolicy from './PrivacyPolicy.jsx';
import Footer from './Footer.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<><App /><Footer /></>} />
        <Route path="/about" element={<><About /><Footer /></>} />
        <Route path="/privacy-policy" element={<><PrivacyPolicy /><Footer /></>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
