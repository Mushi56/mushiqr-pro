// src/components/PaymentModal.jsx
// ─── Legacy Payment Modal — Deprecated ──────────────────────────────────────
// All checkout and payment functionality has been moved into PremiumModal.jsx
// which provides a unified multi-step flow (Features → Plans → Checkout → Success).
//
// This file is preserved for backward compatibility in case any code still
// imports PaymentModal, but it renders nothing and immediately calls onClose.

import { useEffect } from 'react';

export default function PaymentModal({ plan, currency, onClose, onSuccess }) {
  // Immediately close — PremiumModal handles the full purchase flow now.
  useEffect(() => {
    if (onClose) {
      console.warn('[PaymentModal] Deprecated: Use PremiumModal for checkout.');
      onClose();
    }
  }, [onClose]);

  return null;
}
