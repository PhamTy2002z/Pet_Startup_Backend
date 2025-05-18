//src/utils/qr.js
const QRCode = require('qrcode');

/* Sinh QR dạng data-URI (PNG base64) */
async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text, { margin: 2 });
  } catch (err) {
    console.error('[QR] Generate ERROR:', err);
    throw new Error('Failed to generate QR');
  }
}

module.exports = { generateQRCode };
