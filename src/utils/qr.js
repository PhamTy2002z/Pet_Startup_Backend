// src/utils/qr.js
const QRCode = require('qrcode');

async function generateQRCode(text) {
  // trả về Data URI của ảnh QR
  return await QRCode.toDataURL(text, { margin: 2 });
}

module.exports = { generateQRCode };
