import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Media } from '@capacitor-community/media';
import { getPreferences } from './storage';
import { FeatureAccessManager } from '../services/FeatureAccessManager';

/**
 * Convert an ArrayBuffer to a base64 string (binary-safe, no btoa size limits).
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

/**
 * Convert a plain string to base64 in chunks.
 */
function stringToBase64(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return arrayBufferToBase64(bytes.buffer);
}

/**
 * Construct save path: {RootFolder}/{Category}/{Filename}
 */
export function getOrganizedFilePath(filename, category = 'QR Codes') {
  let prefs = {};
  try { prefs = getPreferences() || {}; } catch {}
  const rootFolder = prefs.saveLocation || 'Pictures/Mushi QR Pro';

  const catLower = (category || '').toLowerCase();
  const categoryDir = catLower.includes('barcode') ? 'Barcodes' : 'QR Codes';

  return `${rootFolder}/${categoryDir}/${filename}`;
}

/**
 * Save file natively into internal storage under organized directory structure.
 */
async function saveFileNative(base64Data, filename, category = 'QR Codes') {
  try { await Filesystem.requestPermissions(); } catch {}

  const organizedPath = getOrganizedFilePath(filename, category);
  let fileUri = null;
  let isSavedToDocs = false;
  const targetDir = Capacitor.getPlatform() === 'android' ? Directory.ExternalStorage : Directory.Documents;

  try {
    const docFile = await Filesystem.writeFile({
      path: organizedPath,
      data: base64Data,
      directory: targetDir,
      recursive: true,
    });
    fileUri = docFile.uri;
    isSavedToDocs = true;
  } catch (docErr) {
    try {
      const fallbackFile = await Filesystem.writeFile({
        path: organizedPath,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
      fileUri = fallbackFile.uri;
      isSavedToDocs = true;
    } catch (fallbackErr) {
      console.error('Writing to target directory failed:', fallbackErr);
    }
  }

  if (!fileUri) {
    try {
      const cacheFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
      fileUri = cacheFile.uri;
    } catch {}
  }

  if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    try {
      await Media.requestPermissions();
      if (fileUri) {
        await Media.savePhoto({ path: fileUri, albumIdentifier: 'Mushi QR Pro' });
      }
    } catch (mediaErr) {
      console.warn('Media photo save notice:', mediaErr);
    }
  }

  return { result: isSavedToDocs ? 'saved' : 'share', fileUri, filename, isNative: true };
}

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

// ═══════════════════════════════════════════════════════════════════════════
// PROTECTED EXPORT FUNCTIONS (Enforces FeatureAccessManager at execution time)
// ═══════════════════════════════════════════════════════════════════════════

export async function downloadPNG(canvas, filename = 'qrcode', category = 'QR Codes') {
  const check = FeatureAccessManager.canUseFeature('export_png');
  if (!check.allowed) {
    throw new Error(`Export PNG blocked: ${check.reason}`);
  }

  const dataUrl = canvas.toDataURL('image/png');
  if (Capacitor.isNativePlatform()) {
    return await saveFileNative(dataUrl.split(',')[1], `${filename}.png`, category);
  } else {
    triggerDownload(dataUrl, `${filename}.png`);
    return { result: 'download', filename: `${filename}.png`, isNative: false };
  }
}

export async function downloadJPG(canvas, filename = 'qrcode', category = 'QR Codes') {
  const check = FeatureAccessManager.canUseFeature('export_jpg');
  if (!check.allowed) {
    throw new Error(`Export JPG blocked: ${check.reason}`);
  }

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  
  const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
  if (Capacitor.isNativePlatform()) {
    return await saveFileNative(dataUrl.split(',')[1], `${filename}.jpg`, category);
  } else {
    triggerDownload(dataUrl, `${filename}.jpg`);
    return { result: 'download', filename: `${filename}.jpg`, isNative: false };
  }
}

export async function downloadSVG(canvasOrSvgString, filename = 'qrcode', category = 'QR Codes') {
  const check = FeatureAccessManager.canUseFeature('export_svg');
  if (!check.allowed) {
    throw new Error(`Export SVG blocked: ${check.reason}`);
  }

  let svgContent = '';
  if (typeof canvasOrSvgString === 'string') {
    svgContent = canvasOrSvgString;
  } else if (canvasOrSvgString && canvasOrSvgString.toDataURL) {
    const pngBase64 = canvasOrSvgString.toDataURL('image/png').split(',')[1];
    svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvasOrSvgString.width}" height="${canvasOrSvgString.height}"
     viewBox="0 0 ${canvasOrSvgString.width} ${canvasOrSvgString.height}">
  <image width="${canvasOrSvgString.width}" height="${canvasOrSvgString.height}" xlink:href="data:image/png;base64,${pngBase64}"/>
</svg>`;
  }

  if (Capacitor.isNativePlatform()) {
    return await saveFileNative(btoa(unescape(encodeURIComponent(svgContent))), `${filename}.svg`, category);
  } else {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${filename}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { result: 'download', filename: `${filename}.svg`, isNative: false };
  }
}

export async function downloadPDF(canvas, filename = 'qrcode', category = 'QR Codes') {
  const check = FeatureAccessManager.canUseFeature('export_pdf');
  if (!check.allowed) {
    throw new Error(`Export PDF blocked: ${check.reason}`);
  }

  const imgData = canvas.toDataURL('image/png');
  const size = 210;
  const margin = 20;
  const qrSize = size - margin * 2;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(imgData, 'PNG', margin, margin, qrSize, qrSize);
  
  if (Capacitor.isNativePlatform()) {
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const base64Data = arrayBufferToBase64(pdfArrayBuffer);
    return await saveFileNative(base64Data, `${filename}.pdf`, category);
  } else {
    pdf.save(`${filename}.pdf`);
    return { result: 'download', filename: `${filename}.pdf`, isNative: false };
  }
}
