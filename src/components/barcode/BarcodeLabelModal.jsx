import React, { useState } from 'react';
import { X, Printer, FileText, Check, AlertCircle, Layers } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { getOrganizedFilePath } from '../../utils/exportUtils';

export default function BarcodeLabelModal({
  isOpen,
  onClose,
  canvasRef,
  bcid,
  text,
  showToast
}) {
  if (!isOpen) return null;

  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [paper, setPaper] = useState('a4'); // 'a4' | 'a5' | 'letter'
  const [copies, setCopies] = useState(12); // Number of labels to generate on sheet
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paper === 'letter' ? 'letter' : paper
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Layout: 3 columns x 4 rows = 12 labels per A4 page
      const cols = paper === 'a5' ? 2 : 3;
      const rows = paper === 'a5' ? 3 : 4;
      const marginX = 10;
      const marginY = 15;
      const cellWidth = (pageWidth - marginX * 2) / cols;
      const cellHeight = (pageHeight - marginY * 2) / rows;

      const barcodeDataUrl = canvasRef.current.toDataURL('image/png');

      let currentCopy = 0;
      let pageNumber = 1;

      while (currentCopy < copies) {
        if (currentCopy > 0 && currentCopy % (cols * rows) === 0) {
          doc.addPage();
          pageNumber++;
        }

        const indexOnPage = currentCopy % (cols * rows);
        const col = indexOnPage % cols;
        const row = Math.floor(indexOnPage / cols);

        const x = marginX + col * cellWidth + 2;
        const y = marginY + row * cellHeight + 2;
        const labelW = cellWidth - 4;
        const labelH = cellHeight - 4;

        // Draw light dotted label border
        doc.setDrawColor(220, 220, 225);
        doc.setLineDashPattern([1.5, 1.5], 0);
        doc.rect(x, y, labelW, labelH);

        // Product Name Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(20, 20, 25);
        doc.text(productName, x + labelW / 2, y + 6, { align: 'center' });

        // SKU & Price Line
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 100, 110);
        if (sku) doc.text(`SKU: ${sku}`, x + 4, y + 11);
        if (price) doc.text(price, x + labelW - 4, y + 11, { align: 'right' });

        // Barcode Image
        const imgH = labelH - 18;
        const imgW = labelW - 8;
        doc.addImage(barcodeDataUrl, 'PNG', x + 4, y + 13, imgW, imgH, undefined, 'FAST');

        currentCopy++;
      }

      const timestamp = Date.now();
      const filename = `labels_${bcid}_${timestamp}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const pdfArrayBuffer = doc.output('arraybuffer');
        const bytes = new Uint8Array(pdfArrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
        }
        const base64Data = btoa(binary);

        const targetDir = Capacitor.getPlatform() === 'android' ? Directory.ExternalStorage : Directory.Documents;
        const organizedPath = getOrganizedFilePath(filename, 'Barcodes');

        let savedUri = null;
        try {
          const res = await Filesystem.writeFile({
            path: organizedPath,
            data: base64Data,
            directory: targetDir,
            recursive: true
          });
          savedUri = res.uri;
        } catch (_) {
          const res = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache,
            recursive: true
          });
          savedUri = res.uri;
        }

        showToast('Labels PDF Generated!', 'success');
        if (savedUri) {
          try {
            await Share.share({
              title: 'Barcode Labels Sheet',
              url: savedUri,
              dialogTitle: 'Print or Share Label Sheet'
            });
          } catch (_) {}
        }
      } else {
        doc.save(filename);
        showToast('Labels PDF Downloaded', 'success');
      }

      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to generate labels PDF', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        background: 'var(--bg-card, #FFFFFF)',
        borderRadius: 24,
        padding: '24px',
        maxWidth: 440,
        width: '100%',
        boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent-primary, #D6003D)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              PRINT / LABEL MODE
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 900, margin: '2px 0 0 0', color: 'var(--text-primary, #1C1C1E)' }}>
              Create Label Sheet
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-hover, rgba(0,0,0,0.06))',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary, #636366)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Mushi Water 500ml"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: 40,
                borderRadius: 12,
                border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary, #1C1C1E)',
                background: 'var(--bg-hover, rgba(0,0,0,0.04))'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. MWS500"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
                  padding: '0 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary, #1C1C1E)',
                  background: 'var(--bg-hover, rgba(0,0,0,0.04))'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                Price
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. RM 2.50"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid var(--border-color, rgba(0,0,0,0.15))',
                  padding: '0 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary, #1C1C1E)',
                  background: 'var(--bg-hover, rgba(0,0,0,0.04))'
                }}
              />
            </div>
          </div>

          {/* Paper Size */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Paper Size
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {['a4', 'a5', 'letter'].map(p => (
                <button
                  key={p}
                  onClick={() => setPaper(p)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: paper === p ? '2px solid var(--accent-primary, #D6003D)' : '1px solid var(--border-color, rgba(0,0,0,0.08))',
                    background: paper === p ? 'rgba(214, 0, 61, 0.06)' : 'var(--bg-elevated, #FFFFFF)',
                    color: paper === p ? 'var(--accent-primary, #D6003D)' : 'var(--text-primary, #1C1C1E)',
                    fontWeight: 700,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Total Copies */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary, #636366)', textTransform: 'uppercase' }}>
                Labels to Print
              </label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary, #D6003D)' }}>
                {copies} labels
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          style={{
            background: 'var(--accent-primary, #D6003D)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            padding: '13px 20px',
            fontSize: 14,
            fontWeight: 800,
            cursor: isGenerating ? 'wait' : 'pointer',
            boxShadow: '0 4px 14px rgba(214, 0, 61, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 4
          }}
        >
          <Printer size={16} />
          <span>{isGenerating ? 'Generating Sheet...' : 'Generate PDF'}</span>
        </button>
      </div>
    </div>
  );
}
