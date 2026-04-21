import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Export QR code in various formats
 */

async function saveFileNative(base64Data, filename) {
  try {
    const savedFile = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents
    });
    
    // Attempt to share/save to gallery for better UX
    await Share.share({
      title: 'MushiQR Pro',
      url: savedFile.uri,
      dialogTitle: 'Save or Share your QR Code'
    });
  } catch (e) {
    console.error('File save failed', e);
    alert('Failed to save file. Please ensure storage permissions are granted.');
  }
}

function triggerDownload(url, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

export async function downloadPNG(canvas, filename = 'qrcode') {
  const dataUrl = canvas.toDataURL('image/png');
  if (Capacitor.isNativePlatform()) {
    await saveFileNative(dataUrl.split(',')[1], `${filename}.png`);
  } else {
    triggerDownload(dataUrl, `${filename}.png`);
  }
}

export async function downloadJPG(canvas, filename = 'qrcode') {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  ctx.drawImage(canvas, 0, 0);
  
  const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
  if (Capacitor.isNativePlatform()) {
    await saveFileNative(dataUrl.split(',')[1], `${filename}.jpg`);
  } else {
    triggerDownload(dataUrl, `${filename}.jpg`);
  }
}

export async function downloadSVG(canvas, filename = 'qrcode') {
  const dataUrl = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}"
     viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}"/>
</svg>`;
  
  if (Capacitor.isNativePlatform()) {
    const base64Data = btoa(unescape(encodeURIComponent(svgContent)));
    await saveFileNative(base64Data, `${filename}.svg`);
  } else {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${filename}.svg`);
    URL.revokeObjectURL(url);
  }
}

export async function downloadPDF(canvas, filename = 'qrcode') {
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
    const base64Data = pdf.output('datauristring').split(',')[1];
    await saveFileNative(base64Data, `${filename}.pdf`);
  } else {
    pdf.save(`${filename}.pdf`);
  }
}
