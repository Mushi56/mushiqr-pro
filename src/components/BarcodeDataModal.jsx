import React, { useState, useEffect, useRef } from 'react';
import {
  X, Check, ChevronRight, Info, Package, ShoppingCart, Truck,
  BookOpen, Syringe, Mail, Globe, Hash, AlignLeft, Layers, Zap,
  Building2, Tag, Key, MapPin, Pill, FileText, Barcode, Clipboard
} from 'lucide-react';
import { Clipboard as CapacitorClipboard } from '@capacitor/clipboard';

// ─── Styled Sub-components ──────────────────────────────────────────────────

function SegmentedInput({ label, value, onChange, maxLength, placeholder, hint, width = 1, monospace = false, inputMode = 'text', Icon, isValid, errorMsg }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const hasValue = value && String(value).trim().length > 0;

  // Sync external value into DOM only when it truly differs (e.g. Paste button, reset)
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== (value || '')) {
      inputRef.current.value = value || '';
    }
  }, [value]);

  const handleChange = (e) => {
    let v = e.target.value;
    if (maxLength) v = v.slice(0, maxLength);
    onChange(v);
  };

  const pasteFromClipboard = async () => {
    let text = '';
    try {
      const res = await CapacitorClipboard.read();
      text = res?.value || '';
    } catch (_) {}
    if (!text) {
      try { text = await navigator.clipboard?.readText() || ''; } catch (_) {}
    }
    if (text) {
      const finalVal = maxLength ? text.slice(0, maxLength) : text;
      if (inputRef.current) inputRef.current.value = finalVal;
      onChange(finalVal);
    }
  };

  return (
    <div style={{ flex: width, display: 'flex', flexDirection: 'column' }} className="form-group">
      {label && (
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hint && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{hint}</span>}
            <button
              type="button"
              onClick={pasteFromClipboard}
              style={{ background: 'rgba(255, 77, 109, 0.1)', border: 'none', color: 'var(--accent-primary)', fontSize: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px' }}
            >
              <Clipboard size={11} /> Paste
            </button>
          </div>
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: focused ? 'var(--accent-primary)' : 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 5,
            transition: 'color 0.2s'
          }}>
            <Icon size={15} strokeWidth={2.2} />
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          defaultValue={value}
          onChange={handleChange}
          onInput={handleChange}
          maxLength={maxLength}
          placeholder={placeholder}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            paddingLeft: Icon ? '36px' : '14px',
            paddingRight: (maxLength || (hasValue && isValid !== undefined)) ? '48px' : '14px',
            fontFamily: monospace ? '"JetBrains Mono", "Fira Code", "Courier New", monospace' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            height: '48px',
            boxSizing: 'border-box'
          }}
        />
        {maxLength && (
          <span style={{
            position: 'absolute',
            right: (hasValue && isValid !== undefined) ? '32px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '9px',
            color: value.length === maxLength ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: 700
          }}>
            {value.length}/{maxLength}
          </span>
        )}
        {hasValue && isValid !== undefined && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: isValid ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
            color: isValid ? '#34C759' : '#FF3B30',
            zIndex: 5
          }}>
            {isValid ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
          </div>
        )}
      </div>
      {hasValue && isValid === false && errorMsg && (
        <div style={{ color: '#FF3B30', fontSize: '11px', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚠</span> {errorMsg}
        </div>
      )}
    </div>
  );
}

function SegmentedTextarea({ label, value, onChange, placeholder, hint, maxLength, rows = 4, monospace = true, Icon, isValid, errorMsg }) {
  const [focused, setFocused] = useState(false);
  const hasValue = value && String(value).trim().length > 0;
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {label}
            </span>
            {/* Validation badge removed from label as requested */}
          </div>
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{hint}</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: focused ? 'var(--accent-primary)' : 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 5,
            transition: 'color 0.2s'
          }}>
            <Icon size={15} strokeWidth={2.2} />
          </div>
        )}
        <textarea
          className="form-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            paddingLeft: Icon ? '36px' : '14px',
            paddingRight: (hasValue && isValid !== undefined) ? '36px' : '14px',
            fontFamily: monospace ? '"JetBrains Mono", "Fira Code", "Courier New", monospace' : 'inherit',
            fontWeight: 600,
            fontSize: '13px',
            lineHeight: 1.5,
            boxSizing: 'border-box'
          }}
        />
        {maxLength && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: value.length > maxLength * 0.9 ? '#FF3B30' : 'var(--text-muted)' }}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
        {hasValue && isValid !== undefined && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: isValid ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.15)',
            color: isValid ? '#34C759' : '#FF3B30',
            zIndex: 5
          }}>
            {isValid ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
          </div>
        )}
      </div>
      {hasValue && isValid === false && errorMsg && (
        <div style={{ color: '#FF3B30', fontSize: '11px', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚠</span> {errorMsg}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, hint, Icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {label}
          </span>
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{hint}</span>}
        </label>
      )}
      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: focused ? 'var(--accent-primary)' : 'var(--text-muted)',
            pointerEvents: 'none',
            zIndex: 5,
            transition: 'color 0.2s'
          }}>
            <Icon size={15} strokeWidth={2.2} />
          </div>
        )}
        <select
          className="form-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            paddingLeft: Icon ? '36px' : '14px',
            paddingRight: '36px',
            fontWeight: 600,
            fontSize: '13px',
            height: '48px',
            boxSizing: 'border-box'
          }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          color: 'var(--text-muted)'
        }}>
          <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
        </div>
      </div>
    </div>
  );
}

function TagSelector({ label, value, onChange, options, hint }) {
  return (
    <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {label}
          </span>
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>{hint}</span>}
        </label>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1.5px solid ${value === o.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              background: value === o.value ? 'var(--accent-soft)' : 'var(--bg-primary)',
              color: value === o.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function InfoBox({ text, type = 'info' }) {
  const colors = {
    info: { bg: 'rgba(0, 122, 255, 0.08)', border: 'rgba(0, 122, 255, 0.2)', text: '#007AFF' },
    tip: { bg: 'rgba(52, 199, 89, 0.08)', border: 'rgba(52, 199, 89, 0.2)', text: '#34C759' },
    warn: { bg: 'rgba(255, 149, 0, 0.08)', border: 'rgba(255, 149, 0, 0.2)', text: '#FF9500' }
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start'
    }}>
      <Info size={13} style={{ color: c.text, flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 11, color: c.text, lineHeight: 1.5, fontWeight: 600 }}>{text}</span>
    </div>
  );
}

function PayloadPreview({ value, isValid, errorMsg }) {
  return null;
}

// ─── Category Badge ──────────────────────────────────────────────────────────

const CATEGORY_META = {
  retail: { label: 'Retail', Icon: ShoppingCart, color: '#007AFF', bg: 'rgba(0,122,255,0.1)' },
  logistics: { label: 'Logistics', Icon: Truck, color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  library: { label: 'Library/Medical', Icon: BookOpen, color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  pharma: { label: 'Pharma', Icon: Syringe, color: '#AF52DE', bg: 'rgba(175,82,222,0.1)' },
  postal: { label: 'Postal', Icon: Mail, color: '#FF2D55', bg: 'rgba(255,45,85,0.1)' },
  '2d': { label: '2D Matrix', Icon: Layers, color: '#5856D6', bg: 'rgba(88,86,214,0.1)' },
  industrial: { label: 'Industrial', Icon: Zap, color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  general: { label: 'General', Icon: AlignLeft, color: '#00F0FF', bg: 'rgba(0,240,255,0.1)' }
};

// ─── Form Builders per Barcode Type ─────────────────────────────────────────

function EAN13Form({ fields, setFields, autoCheckDigit }) {
  const prefix = fields.countryPrefix || '';
  const mfg = fields.manufacturer || '';
  const prod = fields.productCode || '';
  const manualCheck = fields.manualCheck || '';
  const concat = `${prefix}${mfg}${prod}`;

  // compute check digit
  function ean13Check(s) {
    if (s.length < 12) return '?';
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(s[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return String((10 - (sum % 10)) % 10);
  }

  const check = concat.length === 12 ? ean13Check(concat) : '?';
  const full = autoCheckDigit ? (concat.length === 12 ? concat + check : concat) : (concat + manualCheck);
  const isValid = /^\d{13}$/.test(full);

  return (
    <>
      <InfoBox text="EAN-13 encodes a 13-digit retail GTIN. Country prefix (3 digits) + Manufacturer (5 digits) + Product (4 digits) = 12 digits. The 13th check digit is auto-calculated." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SegmentedInput
          label="Country Prefix" hint="GS1 region code"
          value={prefix}
          onChange={v => setFields(f => ({ ...f, countryPrefix: v.replace(/\D/g, '').slice(0, 3) }))}
          maxLength={3} placeholder="400" inputMode="numeric" width={2} Icon={Globe}
        />
        <SegmentedInput
          label="Manufacturer"
          value={mfg}
          onChange={v => setFields(f => ({ ...f, manufacturer: v.replace(/\D/g, '').slice(0, 5) }))}
          maxLength={5} placeholder="63813" inputMode="numeric" width={3} Icon={Building2}
        />
        <SegmentedInput
          label="Product Code"
          value={prod}
          onChange={v => setFields(f => ({ ...f, productCode: v.replace(/\D/g, '').slice(0, 4) }))}
          maxLength={4} placeholder="3393" inputMode="numeric" width={3} Icon={Tag}
          isValid={autoCheckDigit ? (concat.length === 12) : undefined}
          errorMsg={autoCheckDigit ? "Need exactly 12 digits total" : undefined}
        />
        {!autoCheckDigit && (
          <SegmentedInput
            label="Check Digit" hint="manual"
            value={manualCheck}
            onChange={v => setFields(f => ({ ...f, manualCheck: v.replace(/\D/g, '').slice(0, 1) }))}
            maxLength={1} placeholder="0" inputMode="numeric" width={1} Icon={Check}
            isValid={isValid}
            errorMsg="Need 1 check digit"
          />
        )}
      </div>
      {autoCheckDigit && concat.length === 12 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 10 }}>
          <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>Auto check digit: <strong>{check}</strong> → Full barcode: <code style={{ fontFamily: 'monospace' }}>{full}</code></span>
        </div>
      )}
      <PayloadPreview value={full} isValid={isValid} errorMsg="Need exactly 13 digits total" />
    </>
  );
}

function UPCAForm({ fields, setFields, autoCheckDigit }) {
  const ns = fields.numberSystem || '0';
  const mfg = fields.manufacturer || '';
  const prod = fields.productCode || '';
  const manualCheck = fields.manualCheck || '';
  const concat = `${ns}${mfg}${prod}`;

  function upcaCheck(s) {
    if (s.length < 11) return '?';
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(s[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return String((10 - (sum % 10)) % 10);
  }

  const check = concat.length === 11 ? upcaCheck(concat) : '?';
  const full = autoCheckDigit ? (concat.length === 11 ? concat + check : concat) : (concat + manualCheck);
  const isValid = /^\d{12}$/.test(full);

  return (
    <>
      <InfoBox text="UPC-A is the North American retail standard. Number System (1 digit) + Manufacturer (5 digits) + Product (5 digits) = 11 digits. Check digit is auto-calculated." />
      <TagSelector
        label="Number System Digit" hint="product category"
        value={ns}
        onChange={v => setFields(f => ({ ...f, numberSystem: v }))}
        options={[
          { value: '0', label: '0 — Regular' },
          { value: '1', label: '1 — Reserved' },
          { value: '2', label: '2 — Weight item' },
          { value: '3', label: '3 — Drug/Health' },
          { value: '4', label: '4 — In-store' },
          { value: '5', label: '5 — Coupon' },
          { value: '6', label: '6 — Regular' },
          { value: '7', label: '7 — Regular' },
          { value: '8', label: '8 — Reserved' },
          { value: '9', label: '9 — Coupon' }
        ]}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SegmentedInput
          label="Manufacturer Code"
          value={mfg}
          onChange={v => setFields(f => ({ ...f, manufacturer: v.replace(/\D/g, '').slice(0, 5) }))}
          maxLength={5} placeholder="12345" inputMode="numeric" width={1} Icon={Building2}
        />
        <SegmentedInput
          label="Product Code"
          value={prod}
          onChange={v => setFields(f => ({ ...f, productCode: v.replace(/\D/g, '').slice(0, 5) }))}
          maxLength={5} placeholder="67890" inputMode="numeric" width={1} Icon={Tag}
          isValid={autoCheckDigit ? (concat.length === 11) : undefined}
          errorMsg={autoCheckDigit ? "Need 11 total digits" : undefined}
        />
        {!autoCheckDigit && (
          <SegmentedInput
            label="Check Digit" hint="manual"
            value={manualCheck}
            onChange={v => setFields(f => ({ ...f, manualCheck: v.replace(/\D/g, '').slice(0, 1) }))}
            maxLength={1} placeholder="0" inputMode="numeric" width={1} Icon={Check}
            isValid={isValid}
            errorMsg="Need 1 check digit"
          />
        )}
      </div>
      {autoCheckDigit && concat.length === 11 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 10 }}>
          <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>Check: <strong>{check}</strong> → <code style={{ fontFamily: 'monospace' }}>{full}</code></span>
        </div>
      )}
      <PayloadPreview value={full} isValid={isValid} errorMsg="Need 12 total digits" />
    </>
  );
}

function EAN8Form({ fields, setFields, autoCheckDigit }) {
  const prefix = fields.countryPrefix || '';
  const prod = fields.productCode || '';
  const manualCheck = fields.manualCheck || '';
  const concat = `${prefix}${prod}`;

  function ean8Check(s) {
    if (s.length < 7) return '?';
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(s[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return String((10 - (sum % 10)) % 10);
  }

  const check = concat.length === 7 ? ean8Check(concat) : '?';
  const full = autoCheckDigit ? (concat.length === 7 ? concat + check : concat) : (concat + manualCheck);
  const isValid = /^\d{8}$/.test(full);

  return (
    <>
      <InfoBox text="EAN-8 is a condensed 8-digit retail code for small packages. Country prefix (3 digits) + Product code (4 digits) = 7 digits. Check digit is auto-calculated." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SegmentedInput
          label="Country Prefix" hint="GS1 region"
          value={prefix}
          onChange={v => setFields(f => ({ ...f, countryPrefix: v.replace(/\D/g, '').slice(0, 3) }))}
          maxLength={3} placeholder="401" inputMode="numeric" width={1} Icon={Globe}
        />
        <SegmentedInput
          label="Product Code"
          value={prod}
          onChange={v => setFields(f => ({ ...f, productCode: v.replace(/\D/g, '').slice(0, 4) }))}
          maxLength={4} placeholder="2345" inputMode="numeric" width={1} Icon={Tag}
          isValid={autoCheckDigit ? (concat.length === 7) : undefined}
          errorMsg={autoCheckDigit ? "Need exactly 7 digits" : undefined}
        />
        {!autoCheckDigit && (
          <SegmentedInput
            label="Check Digit" hint="manual"
            value={manualCheck}
            onChange={v => setFields(f => ({ ...f, manualCheck: v.replace(/\D/g, '').slice(0, 1) }))}
            maxLength={1} placeholder="0" inputMode="numeric" width={1} Icon={Check}
            isValid={isValid}
            errorMsg="Need 1 check digit"
          />
        )}
      </div>
      {autoCheckDigit && concat.length === 7 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 10 }}>
          <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>Check: <strong>{check}</strong> → <code style={{ fontFamily: 'monospace' }}>{full}</code></span>
        </div>
      )}
      <PayloadPreview value={full} isValid={isValid} errorMsg="Need exactly 8 digits total" />
    </>
  );
}

function ITF14Form({ fields, setFields, autoCheckDigit }) {
  const ind = fields.indicator || '1';
  const gs1 = fields.gs1Prefix || '';
  const item = fields.itemRef || '';
  const manualCheck = fields.manualCheck || '';
  const concat = `${ind}${gs1}${item}`;

  function itf14Check(s) {
    if (s.length < 13) return '?';
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(s[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return String((10 - (sum % 10)) % 10);
  }

  const check = concat.length === 13 ? itf14Check(concat) : '?';
  const full = autoCheckDigit ? (concat.length === 13 ? concat + check : concat) : (concat + manualCheck);
  const isValid = /^\d{14}$/.test(full);

  return (
    <>
      <InfoBox text="ITF-14 encodes a GTIN-14 for shipping cartons. Packaging Indicator (1 digit) + GS1 Company Prefix (6 digits) + Item Reference (6 digits) = 13 digits." type="warn" />
      <TagSelector
        label="Packaging Indicator"
        value={ind}
        onChange={v => setFields(f => ({ ...f, indicator: v }))}
        options={[
          { value: '0', label: '0 — Product' }, { value: '1', label: '1 — Box' }, { value: '2', label: '2 — Case' },
          { value: '3', label: '3 — Pallet' }, { value: '4', label: '4 — Container' }, { value: '8', label: '8 — Reserved' }, { value: '9', label: '9 — Assorted' }
        ]}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SegmentedInput
          label="GS1 Company Prefix"
          value={gs1}
          onChange={v => setFields(f => ({ ...f, gs1Prefix: v.replace(/\D/g, '').slice(0, 6) }))}
          maxLength={6} placeholder="001234" inputMode="numeric" width={1} Icon={Building2}
        />
        <SegmentedInput
          label="Item Reference"
          value={item}
          onChange={v => setFields(f => ({ ...f, itemRef: v.replace(/\D/g, '').slice(0, 6) }))}
          maxLength={6} placeholder="567890" inputMode="numeric" width={1} Icon={Tag}
          isValid={autoCheckDigit ? (concat.length === 13) : undefined}
          errorMsg={autoCheckDigit ? "Need exactly 13 digits total" : undefined}
        />
        {!autoCheckDigit && (
          <SegmentedInput
            label="Check Digit" hint="manual"
            value={manualCheck}
            onChange={v => setFields(f => ({ ...f, manualCheck: v.replace(/\D/g, '').slice(0, 1) }))}
            maxLength={1} placeholder="0" inputMode="numeric" width={1} Icon={Check}
            isValid={isValid}
            errorMsg="Need 1 check digit"
          />
        )}
      </div>
      {autoCheckDigit && concat.length === 13 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 10 }}>
          <Check size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)' }}>Check digit: <strong>{check}</strong> → <code style={{ fontFamily: 'monospace' }}>{full}</code></span>
        </div>
      )}
      <PayloadPreview value={full} isValid={isValid} errorMsg="Need exactly 14 digits total" />
    </>
  );
}

function UPCEForm({ fields, setFields }) {
  const ns = fields.numberSystem || '0';
  const body = fields.body || '';
  const full = `${ns}${body}`;
  const isValid = /^\d{7,8}$/.test(full);

  return (
    <>
      <InfoBox text="UPC-E is a condensed 8-digit version of UPC-A for small packages. The 6-digit body is a zero-suppressed UPC-A code." />
      <TagSelector
        label="Number System" hint="0 or 1 only"
        value={ns}
        onChange={v => setFields(f => ({ ...f, numberSystem: v }))}
        options={[{ value: '0', label: '0 — Standard' }, { value: '1', label: '1 — Standard' }]}
      />
      <SegmentedInput
        label="Condensed Barcode Body" hint="6 zero-suppressed digits"
        value={body}
        onChange={v => setFields(f => ({ ...f, body: v.replace(/\D/g, '').slice(0, 6) }))}
        maxLength={6} placeholder="123456" inputMode="numeric" Icon={Hash}
          isValid={isValid}
          errorMsg="Need number system + 6 digits = 7 chars total"
        />
      <PayloadPreview value={full} isValid={isValid} errorMsg="Need number system + 6 digits = 7 chars total" />
    </>
  );
}

function Code128Form({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^[\x00-\x7F]+$/.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="Code 128 is the go-to alphanumeric barcode for logistics and shipping labels. Supports the full 128-character ASCII set with very high data density." />
      <SegmentedTextarea
        label="Barcode Data" hint="full ASCII"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="Enter any alphanumeric text, serial numbers, package tags…"
        maxLength={80}
        rows={3}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="Must contain only ASCII characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Must contain only ASCII characters" />
    </>
  );
}

// ─── Categories & Forms mapping ───
function Code39Form({ fields, setFields }) {
  const value = (fields.data || '').toUpperCase();
  const ALLOWED = /^[A-Z0-9\-\.\ \$\/\+\%]*$/;
  const isValid = ALLOWED.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="Code 39 is an alphanumeric industrial barcode. Supports uppercase A-Z, digits 0-9, and special characters: - . $ / + % (SPACE). Self-checking — no check digit required." type="tip" />
      <SegmentedTextarea
        label="Barcode Data" hint="uppercase + digits + symbols"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.toUpperCase() }))}
        placeholder="ITEM-CODE 1234"
        maxLength={43}
        rows={2}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="Only A-Z, 0-9, and - . $ / + % SPACE allowed"
        />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['A-Z', '0-9', '-', '.', '$', '/', '+', '%', 'SPACE'].map(c => (
          <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 6, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c}</span>
        ))}
      </div>
      <PayloadPreview value={value} isValid={isValid} errorMsg="Only A-Z, 0-9, and - . $ / + % SPACE allowed" />
    </>
  );
}

function Code93Form({ fields, setFields }) {
  const value = (fields.data || '').toUpperCase();
  const ALLOWED = /^[A-Z0-9\-\.\ \$\/\+\%]*$/;
  const isValid = ALLOWED.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="Code 93 is a compact variant of Code 39 with two check digits for improved accuracy. More efficient than Code 39 but less widely supported." />
      <SegmentedTextarea
        label="Barcode Data"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.toUpperCase() }))}
        placeholder="COMPACT-CODE-93"
        maxLength={48}
        rows={2}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="Only A-Z, 0-9, and - . $ / + % SPACE allowed"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Only A-Z, 0-9, and - . $ / + % SPACE allowed" />
    </>
  );
}

function DataMatrixForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 1000;

  return (
    <>
      <InfoBox text="Data Matrix is a 2D matrix code used in industrial part marking. It packs large amounts of alphanumeric data into a tiny footprint." type="tip" />
      <SegmentedTextarea
        label="Data Payload" hint="any text or binary"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="Part serial number, machine ID, ISO compliance string…"
        maxLength={1000}
        rows={4}
        monospace
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot be empty or exceed 1000 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot be empty or exceed 1000 characters" />
    </>
  );
}

function PDF417Form({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 1500;

  return (
    <>
      <InfoBox text="PDF417 is a 2D stacked barcode used on driver's licenses, boarding passes and ID documents. High-capacity: up to 1,500 characters." type="tip" />
      <SegmentedTextarea
        label="Data Payload" hint="large data sets, ID data, document references"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="First Name: John\nLast Name: Doe\nDOB: 1990-01-01\nID: 123456789"
        maxLength={1500}
        rows={5}
        monospace
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot be empty or exceed 1500 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot be empty or exceed 1500 characters" />
    </>
  );
}

function CodabarForm({ fields, setFields }) {
  const start = fields.start || 'A';
  const body = fields.body || '';
  const stop = fields.stop || 'B';
  const full = `${start}${body}${stop}`;
  const isValid = /^[A-D][0-9\-\$\:\/\.\+]+[A-D]$/i.test(full);

  return (
    <>
      <InfoBox text="Codabar is used in blood banks, libraries, and photo labs. Start/stop characters define the record boundary. Only digits and - $ : / . + are valid in the body." type="warn" />
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Start Char</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['A', 'B', 'C', 'D'].map(c => (
              <button
                key={c}
                onClick={() => setFields(f => ({ ...f, start: c }))}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `2px solid ${start === c ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: start === c ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  color: start === c ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >{c}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Stop Char</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['A', 'B', 'C', 'D'].map(c => (
              <button
                key={c}
                onClick={() => setFields(f => ({ ...f, stop: c }))}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 10,
                  border: `2px solid ${stop === c ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: stop === c ? 'var(--accent-soft)' : 'var(--bg-primary)',
                  color: stop === c ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >{c}</button>
            ))}
          </div>
        </div>
      </div>
      <SegmentedInput
        label="Barcode Body" hint="digits, - $ : / . +"
        value={body}
        onChange={v => setFields(f => ({ ...f, body: v.replace(/[^0-9\-\$\:\/\.\+]/g, '') }))}
        placeholder="123456"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Start + digits/symbols + Stop required"
        />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['0-9', '-', '$', ':', '/', '.', '+'].map(c => (
          <span key={c} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 6, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c}</span>
        ))}
      </div>
      <PayloadPreview value={full} isValid={isValid} errorMsg="Start + digits/symbols + Stop required" />
    </>
  );
}

function Code11Form({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^[0-9\-]+$/.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="Code 11 is used in telecommunications equipment labeling. Supports digits 0-9 and hyphens only. Can optionally include 1 or 2 check digits." />
      <SegmentedInput
        label="Data (digits and hyphens)" hint="telecommunications ID"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/[^0-9\-]/g, '') }))}
        placeholder="123-456-789"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Digits 0-9 and hyphens only"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Digits 0-9 and hyphens only" />
    </>
  );
}

function MSIForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^\d+$/.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="MSI Plessey is used on retail shelf labels and inventory cards. Accepts numeric-only data. Variants include MSI-10, MSI-11, MSI-1010, MSI-1110 check digits." />
      <SegmentedInput
        label="Numeric Shelf Code" hint="digits only"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '') }))}
        placeholder="1234567"
        inputMode="numeric"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Digits only"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Digits only" />
    </>
  );
}

function I25Form({ fields, setFields }) {
  const value = fields.data || '';
  const isEven = value.length % 2 === 0;
  const isValid = /^\d+$/.test(value) && isEven && value.length > 0;

  return (
    <>
      <InfoBox text="Interleaved 2 of 5 (ITF) encodes digits in pairs. It MUST have an even number of digits — pair the data or add a leading zero." type="warn" />
      <SegmentedInput
        label="Numeric Data (even length)" hint="must be even number of digits"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '') }))}
        placeholder="12345678"
        inputMode="numeric"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg={!isEven ? "Must have even digit count" : "Digits only"}
        />
      {value.length > 0 && !isEven && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)', borderRadius: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#FF9500' }}>⚠ Odd number of digits. Add a leading zero to make it even.</span>
          <button
            onClick={() => setFields(f => ({ ...f, data: '0' + f.data }))}
            style={{ marginLeft: 'auto', padding: '4px 10px', background: '#FF9500', border: 'none', borderRadius: 8, color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}
          >Auto-Fix</button>
        </div>
      )}
      <PayloadPreview value={value} isValid={isValid} errorMsg={!isEven ? "Must have even digit count" : "Digits only"} />
    </>
  );
}

function PostalForm({ fields, setFields, type }) {
  const fmt = fields.format || (type === 'planet' ? '11' : '5');
  const value = fields.data || '';
  const limits = { '5': 5, '9': 9, '11': 11, '12': 12, '13': 13, '14': 14 };
  const maxLen = limits[fmt] || 11;
  const isValid = /^\d+$/.test(value) && value.length === maxLen;

  const fmtOptions = type === 'planet'
    ? [{ value: '11', label: '11 Digit' }, { value: '12', label: '12 Digit' }, { value: '13', label: '13 Digit' }, { value: '14', label: '14 Digit' }]
    : [{ value: '5', label: '5-Digit ZIP' }, { value: '9', label: '9-Digit ZIP+4' }, { value: '11', label: '11-Digit Delivery Point' }];

  return (
    <>
      <InfoBox text={type === 'planet' ? "USPS Planet Code tracks mailpieces. Requires exactly 11, 12, 13, or 14 digits." : "USPS Postnet encodes ZIP codes for automated mail sorting. Exactly 5, 9, or 11 digits required."} />
      <TagSelector
        label="Format" hint="digit count"
        value={fmt}
        onChange={v => setFields(f => ({ ...f, format: v, data: f.data?.slice(0, limits[v]) || '' }))}
        options={fmtOptions}
      />
      <SegmentedInput
        label={`ZIP / Routing Code (${maxLen} digits)`}
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '').slice(0, maxLen) }))}
        maxLength={maxLen}
        placeholder={'0'.repeat(maxLen)}
        inputMode="numeric"
        monospace
        Icon={MapPin}
          isValid={isValid}
          errorMsg={`Exactly ${maxLen} digits required`}
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg={`Exactly ${maxLen} digits required`} />
    </>
  );
}

function RoyalMailForm({ fields, setFields }) {
  const value = (fields.data || '').toUpperCase();
  const isValid = /^[A-Z0-9]+$/i.test(value) && value.length >= 1;

  return (
    <>
      <InfoBox text="Royal Mail RM4SCC (Customer Bar Code) is used for UK postal sorting. Encodes a sortcode and postal delivery address code in alphanumeric characters." />
      <SegmentedInput
        label="UK Postal Routing Code" hint="alphanumeric postcode + delivery info"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
        placeholder="SN34RD1A"
        monospace
        Icon={MapPin}
          isValid={isValid}
          errorMsg="Alphanumeric characters only"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Alphanumeric characters only" />
    </>
  );
}

function GS1DataBarForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^(?:\(01\))?\d{13,14}$/.test(value);

  return (
    <>
      <InfoBox text="GS1 DataBar Omnidirectional encodes a GTIN-13 or GTIN-14. Used on fresh foods and items too small for EAN-13. Must be exactly 13 or 14 digits." />
      <SegmentedInput
        label="GTIN (13 or 14 digits)" hint="GS1 trade item number"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '').slice(0, 14) }))}
        maxLength={14}
        placeholder="01234567890128"
        inputMode="numeric"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Must be exactly 13 or 14 digits"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Must be exactly 13 or 14 digits" />
    </>
  );
}

function GS1128Form({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^[\x00-\x7F]+$/.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="GS1-128 (formerly UCC-128/EAN-128) encodes GS1 Application Identifiers (AI). Format: (AI)data pairs like (01)GTIN (10)BatchLot (17)Expiry." type="tip" />
      <SegmentedTextarea
        label="GS1 AI Encoded Data" hint="(AI)value pairs"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="(01)00012345678905(10)ABC-123(17)261231"
        maxLength={80}
        rows={3}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="Must contain ASCII characters only"
        />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['(01) GTIN', '(10) Batch', '(11) Prod Date', '(17) Exp Date', '(21) Serial'].map(ai => (
          <span key={ai} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 6, color: 'var(--text-muted)' }}>{ai}</span>
        ))}
      </div>
      <PayloadPreview value={value} isValid={isValid} errorMsg="Must contain ASCII characters only" />
    </>
  );
}

function TelepenForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = /^[\x00-\x7F]+$/.test(value) && value.length > 0;

  return (
    <>
      <InfoBox text="Telepen encodes the full 128-character ASCII set. Originally developed for library book labeling in the UK. High accuracy with variable length data." />
      <SegmentedTextarea
        label="Data Payload" hint="full ASCII"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="TELEPEN-ASCII-DATA"
        maxLength={69}
        rows={3}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="ASCII characters only"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="ASCII characters only" />
    </>
  );
}

function PharmacodeForm({ fields, setFields }) {
  const value = fields.data || '';
  const num = parseInt(value);
  const isValid = /^\d+$/.test(value) && num >= 3 && num <= 131070;

  return (
    <>
      <InfoBox text="Pharmacode (Pharmaceutical Binary Code) is used on packaging for pharmaceutical products. Encodes an integer from 3 to 131,070." type="warn" />
      <SegmentedInput
        label="Prescription Package Code" hint="integer from 3 to 131,070"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '') }))}
        placeholder="11309"
        inputMode="numeric"
        monospace
        Icon={Pill}
          isValid={isValid}
          errorMsg="Integer value between 3 and 131,070"
        />
      {value && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Value Range Check</div>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-hover)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (num / 131070) * 100)}%`,
                background: isValid ? '#34C759' : '#FF3B30',
                borderRadius: 3,
                transition: 'width 0.3s, background 0.3s'
              }} />
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: isValid ? '#34C759' : '#FF3B30' }}>
            {isValid ? `${num.toLocaleString()} ✓` : num < 3 ? 'Too low' : 'Too high'}
          </span>
        </div>
      )}
      <PayloadPreview value={value} isValid={isValid} errorMsg="Integer value between 3 and 131,070" />
    </>
  );
}

function AztecForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 1500;

  return (
    <>
      <InfoBox text="Aztec Code is a 2D matrix barcode used in transit ticketing, airline boarding passes, and driving licenses. Extremely compact and resilient." type="tip" />
      <SegmentedTextarea
        label="Data Payload" hint="any text/binary data"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="AZTEC TRANSIT TICKET DATA"
        maxLength={1500}
        rows={4}
        monospace
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot be empty or exceed 1500 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot be empty or exceed 1500 characters" />
    </>
  );
}

function MaxiCodeForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 138;

  return (
    <>
      <InfoBox text="MaxiCode is a fixed-size 2D matrix barcode used by UPS for worldwide package routing. Encodes up to 138 characters in a hexagonal matrix." type="warn" />
      <SegmentedTextarea
        label="Shipment Data" hint="max 138 characters"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.slice(0, 138) }))}
        placeholder="MAXICODE PACKAGE ROUTING"
        maxLength={138}
        rows={3}
        monospace
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot exceed 138 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot exceed 138 characters" />
    </>
  );
}

function QRCodeForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0;

  return (
    <>
      <InfoBox text="Standard QR Code — supports URLs, text, contact cards, WiFi networks, and any binary data up to 4,296 characters." type="tip" />
      <SegmentedTextarea
        label="QR Data" hint="URL, text, vCard, WiFi, etc."
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="https://example.com"
        maxLength={4296}
        rows={4}
        monospace
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot be empty"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot be empty" />
    </>
  );
}

function MicroQRForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 35;

  return (
    <>
      <InfoBox text="Micro QR is a smaller variant of the QR Code, designed for components and tags with limited space. Maximum 35 characters." />
      <SegmentedInput
        label="Compact Data" hint="max 35 characters"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.slice(0, 35) }))}
        maxLength={35}
        placeholder="MICRO-QR-DATA"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Cannot exceed 35 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot exceed 35 characters" />
    </>
  );
}

function HanXinForm({ fields, setFields }) {
  const value = fields.data || '';
  const isValid = value.length > 0 && value.length <= 1000;

  return (
    <>
      <InfoBox text="Han Xin Code (GB/T 27766-2011) is China's national standard 2D barcode. Optimized for Chinese character sets — supports GB 18030, UTF-8, and binary." type="tip" />
      <SegmentedTextarea
        label="Data Payload" hint="any text including Chinese characters"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder="汉信码 HAN XIN CODE 2D MATRIX"
        maxLength={1000}
        rows={4}
        monospace={false}
        Icon={FileText}
          isValid={isValid}
          errorMsg="Cannot be empty or exceed 1000 characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Cannot be empty or exceed 1000 characters" />
    </>
  );
}

function GenericStackedForm({ fields, setFields, standard }) {
  const value = fields.data || '';
  const isValid = /^[\x00-\x7F]+$/.test(value) && value.length > 0 && value.length <= (standard.maxLen || 80);

  return (
    <>
      <InfoBox text={standard.info || "Stacked barcode format supporting alphanumeric ASCII data."} />
      <SegmentedTextarea
        label="Data Payload" hint="ASCII text"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v }))}
        placeholder={standard.placeholder || "ENTER DATA"}
        maxLength={standard.maxLen || 80}
        rows={3}
        monospace
        Icon={Barcode}
          isValid={isValid}
          errorMsg="Must contain ASCII characters"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Must contain ASCII characters" />
    </>
  );
}

function ChannelCodeForm({ fields, setFields }) {
  const value = fields.data || '';
  const num = parseInt(value || '0');
  const isValid = /^\d+$/.test(value) && num >= 0 && num <= 9999999;

  return (
    <>
      <InfoBox text="Channel Code is a high-density 1D barcode that encodes small integers (0–9,999,999) using 3–7 channels. Used in compact industrial marking." />
      <SegmentedInput
        label="Numeric Code" hint="integer 0 – 9,999,999"
        value={value}
        onChange={v => setFields(f => ({ ...f, data: v.replace(/\D/g, '').slice(0, 7) }))}
        maxLength={7}
        placeholder="123456"
        inputMode="numeric"
        monospace
        Icon={Hash}
          isValid={isValid}
          errorMsg="Positive integer up to 7 digits only"
        />
      <PayloadPreview value={value} isValid={isValid} errorMsg="Positive integer up to 7 digits only" />
    </>
  );
}

// ─── Category Icon mapping ────────────────────────────────────────────────────
const BCID_CATEGORY = {
  ean13: 'retail', upca: 'retail', ean8: 'retail', upce: 'retail', gs1databar: 'retail',
  itf14: 'logistics', gs1128: 'logistics', code128: 'logistics', telepen: 'logistics',
  code39: 'industrial', code93: 'industrial', code11: 'industrial', msi: 'industrial', i25: 'industrial',
  codabar: 'library',
  pharmacode: 'pharma',
  postnet: 'postal', planet: 'postal', royalmail: 'postal',
  datamatrix: '2d', pdf417: '2d', aztec: '2d', maxicode: '2d', qrcode: '2d', microqrcode: '2d', hanxin: '2d',
  codablockf: 'general', code16k: 'general', code49: 'general', channelcode: 'general'
};

// ─── Main Modal Component ─────────────────────────────────────────────────────
export default function BarcodeDataModal({ isOpen, bcid, initialFields, onApply, onClose, standard }) {
  const [fields, setFields] = useState(initialFields || {});
  const [autoCheckDigit, setAutoCheckDigit] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setFields(initialFields || {});
    }
  }, [isOpen, bcid]);

  if (!isOpen || !standard) return null;

  const cat = BCID_CATEGORY[bcid] || 'general';
  const meta = CATEGORY_META[cat] || CATEGORY_META.general;
  const MetaIcon = meta.Icon;

  function getCompiledValue() {
    switch (bcid) {
      case 'ean13': return `${fields.countryPrefix || ''}${fields.manufacturer || ''}${fields.productCode || ''}${!autoCheckDigit && fields.manualCheck ? fields.manualCheck : ''}`;
      case 'upca': return `${fields.numberSystem || '0'}${fields.manufacturer || ''}${fields.productCode || ''}${!autoCheckDigit && fields.manualCheck ? fields.manualCheck : ''}`;
      case 'ean8': return `${fields.countryPrefix || ''}${fields.productCode || ''}${!autoCheckDigit && fields.manualCheck ? fields.manualCheck : ''}`;
      case 'itf14': return `${fields.indicator || '1'}${fields.gs1Prefix || ''}${fields.itemRef || ''}${!autoCheckDigit && fields.manualCheck ? fields.manualCheck : ''}`;
      case 'upce': return `${fields.numberSystem || '0'}${fields.body || ''}`;
      case 'codabar': return `${fields.start || 'A'}${fields.body || ''}${fields.stop || 'B'}`;
      case 'postnet':
      case 'planet': return fields.data || '';
      default: return fields.data || '';
    }
  }

  const renderForm = () => {
    switch (bcid) {
      case 'ean13': return <EAN13Form fields={fields} setFields={setFields} autoCheckDigit={autoCheckDigit} />;
      case 'upca': return <UPCAForm fields={fields} setFields={setFields} autoCheckDigit={autoCheckDigit} />;
      case 'ean8': return <EAN8Form fields={fields} setFields={setFields} autoCheckDigit={autoCheckDigit} />;
      case 'itf14': return <ITF14Form fields={fields} setFields={setFields} autoCheckDigit={autoCheckDigit} />;
      case 'upce': return <UPCEForm fields={fields} setFields={setFields} />;
      case 'code128': return <Code128Form fields={fields} setFields={setFields} />;
      case 'code39': return <Code39Form fields={fields} setFields={setFields} />;
      case 'code93': return <Code93Form fields={fields} setFields={setFields} />;
      case 'datamatrix': return <DataMatrixForm fields={fields} setFields={setFields} />;
      case 'pdf417': return <PDF417Form fields={fields} setFields={setFields} />;
      case 'codabar': return <CodabarForm fields={fields} setFields={setFields} />;
      case 'code11': return <Code11Form fields={fields} setFields={setFields} />;
      case 'msi': return <MSIForm fields={fields} setFields={setFields} />;
      case 'i25': return <I25Form fields={fields} setFields={setFields} />;
      case 'postnet': return <PostalForm fields={fields} setFields={setFields} type="postnet" />;
      case 'planet': return <PostalForm fields={fields} setFields={setFields} type="planet" />;
      case 'royalmail': return <RoyalMailForm fields={fields} setFields={setFields} />;
      case 'gs1databar': return <GS1DataBarForm fields={fields} setFields={setFields} />;
      case 'gs1128': return <GS1128Form fields={fields} setFields={setFields} />;
      case 'telepen': return <TelepenForm fields={fields} setFields={setFields} />;
      case 'pharmacode': return <PharmacodeForm fields={fields} setFields={setFields} />;
      case 'aztec': return <AztecForm fields={fields} setFields={setFields} />;
      case 'maxicode': return <MaxiCodeForm fields={fields} setFields={setFields} />;
      case 'qrcode': return <QRCodeForm fields={fields} setFields={setFields} />;
      case 'microqrcode': return <MicroQRForm fields={fields} setFields={setFields} />;
      case 'hanxin': return <HanXinForm fields={fields} setFields={setFields} />;
      case 'codablockf': return <GenericStackedForm fields={fields} setFields={setFields} standard={{ maxLen: 80, placeholder: 'CODABLOCK-F DATA', info: 'Codablock F is a stacked barcode that encodes up to 2,725 characters of alphanumeric data across multiple rows.' }} />;
      case 'code16k': return <GenericStackedForm fields={fields} setFields={setFields} standard={{ maxLen: 77, placeholder: 'CODE-16K DATA', info: 'Code 16K is a multi-row stacked barcode storing 77 ASCII characters in a compact rectangular format.' }} />;
      case 'code49': return <GenericStackedForm fields={fields} setFields={setFields} standard={{ maxLen: 81, placeholder: 'CODE-49 DATA', info: 'Code 49 is a multi-row barcode encoding up to 81 alphanumeric characters in a stacked format.' }} />;
      case 'channelcode': return <ChannelCodeForm fields={fields} setFields={setFields} />;
      default: return (
        <SegmentedTextarea
          label="Barcode Data"
          value={fields.data || ''}
          onChange={v => setFields(f => ({ ...f, data: v }))}
          placeholder={standard.placeholder}
          maxLength={200}
          rows={3}
          monospace
          Icon={Barcode}
        />
      );
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MetaIcon size={22} style={{ color: meta.color }} />
            </div>
            <div className="modal-header-title" style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{standard.name}</h3>
              <p style={{ margin: 0 }}>{standard.desc}</p>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {renderForm()}

          {/* ── Auto Check Digit Toggle & Checksum Breakdown (Restored) ── */}
          {['ean13', 'upca', 'ean8', 'itf14'].includes(bcid) && (() => {
            const compiledVal = getCompiledValue();
            const checkDigitInfo = standard?.getCheckDigitInfo ? standard.getCheckDigitInfo(compiledVal) : null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-card, #FFFFFF)', padding: '14px 16px', borderRadius: 18,
                  border: '1px solid var(--border-color, rgba(0,0,0,0.08))', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1C1C1E)' }}>Auto Check Digit</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent-primary, #D6003D)', background: 'rgba(214, 0, 61, 0.08)', padding: '2px 6px', borderRadius: 6 }}>GS1</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary, #636366)', marginTop: 2, display: 'block' }}>
                      {autoCheckDigit ? 'Automatically computes modulo-10 check digit' : 'Allow manual complete input'}
                    </span>
                  </div>

                  <button
                    onClick={() => setAutoCheckDigit(!autoCheckDigit)}
                    style={{ width: 52, height: 30, borderRadius: 20, background: autoCheckDigit ? 'var(--accent-primary, #D6003D)' : 'var(--bg-hover, #E5E5EA)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.25s ease', padding: 2 }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FFFFFF', transform: autoCheckDigit ? 'translateX(22px)' : 'translateX(0px)', transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>

                {checkDigitInfo && (
                  <div style={{
                    background: checkDigitInfo.isValid ? 'rgba(52, 199, 89, 0.06)' : 'rgba(255, 59, 48, 0.06)',
                    border: `1px solid ${checkDigitInfo.isValid ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`,
                    borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: checkDigitInfo.isValid ? '#34C759' : '#FF3B30' }}>Modulo-10 Checksum Analysis</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: checkDigitInfo.isValid ? '#34C759' : '#FF3B30' }}>{checkDigitInfo.isValid ? '✓ Valid Checksum' : '✕ Invalid Checksum'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary, #636366)' }}>
                      <span>Calculated Check Digit:</span>
                      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{checkDigitInfo.checkDigit !== null ? checkDigitInfo.checkDigit : '—'}</span>
                    </div>
                    {checkDigitInfo.actualDigit !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary, #636366)' }}>
                        <span>Entered Check Digit:</span>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: checkDigitInfo.actualDigit === checkDigitInfo.checkDigit ? '#34C759' : '#FF3B30' }}>
                          {checkDigitInfo.actualDigit}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Footer Actions */}
        <button
          className="modal-done-btn"
          onClick={() => onApply(getCompiledValue())}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Check size={18} />
          Generate Barcode
        </button>
      </div>
    </div>
  );
}
