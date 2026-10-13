// src/data/qrTemplates/floralTemplates.js
// Floral & Aesthetic Shaped QR Templates matching Circle.avif and Blob Flower.avif

export const FLORAL_TEMPLATES = [
  {
    "id": "template-blob-flower",
    "name": "Glossy Blossom Blob",
    "category": "Floral & Aesthetic",
    "styleFamily": "image",
    "bgImage": "/templates/floral/blob-flower.avif",
    "thumbImage": "/templates/floral/blob-flower-thumb.webp",
    "dimensions": "3584 x 2688 px",
    "heightRatio": 0.75,
    "qrShape": "flower_blob",
    "qrSize": 0.315,
    "qrX": 0.5084,
    "qrY": 0.5022,
    "quietZone": 0,
    "cleanEdges": true,
    "fields": [
      {
        "id": "url",
        "label": "Website / Link URL",
        "type": "url",
        "placeholder": "https://example.com"
      }
    ],
    "preset": {
      "qrColor": "#1B171A",
      "bgColor": "#FFFFFF",
      "bgTransparent": true,
      "cleanEdges": true,
      "dotStyle": "rounded",
      "eyeStyle": "rounded",
      "qrBgShape": "flower_blob",
      "ecLevel": "H"
    }
  },
  {
    "id": "template-circle-flower",
    "name": "Pink Petals Circle",
    "category": "Floral & Aesthetic",
    "styleFamily": "image",
    "bgImage": "/templates/floral/circle-flower.avif",
    "thumbImage": "/templates/floral/circle-flower-thumb.webp",
    "dimensions": "3584 x 2688 px",
    "heightRatio": 0.75,
    "qrShape": "circle",
    "qrSize": 0.335,
    "qrX": 0.50,
    "qrY": 0.50,
    "quietZone": 0,
    "cleanEdges": true,
    "fields": [
      {
        "id": "url",
        "label": "Website / Link URL",
        "type": "url",
        "placeholder": "https://example.com"
      }
    ],
    "preset": {
      "qrColor": "#2A1820",
      "bgColor": "#FFFFFF",
      "bgTransparent": true,
      "cleanEdges": true,
      "dotStyle": "dots",
      "eyeStyle": "circle",
      "qrBgShape": "circle",
      "ecLevel": "H"
    }
  }
];
