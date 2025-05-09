// src/utils/qr.js
const QRCode = require('qrcode');

async function generateQRCode(text) {
  console.log('QR Code generation - Input URL:', text);
  // trả về Data URI của ảnh QR
  const qrDataUri = await QRCode.toDataURL(text, { margin: 2 });
  console.log('QR Code generation - Success');
  return qrDataUri;
}

module.exports = { generateQRCode };
