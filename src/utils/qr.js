// src/utils/qr.js
const QRCode = require('qrcode');

async function generateQRCode(text) {
  try {
    console.log('QR Code generation - Input URL:', text); // Log cho mục đích debug, có thể bỏ khi production

    // Tạo Data URI của mã QR với margin
    const qrDataUri = await QRCode.toDataURL(text, { margin: 2 });

    console.log('QR Code generation - Success');
    return qrDataUri;
  } catch (error) {
    console.error('Error generating QR code:', error); // Log lỗi nếu có
    throw new Error('Failed to generate QR code'); // Ném lỗi rõ ràng
  }
}

module.exports = { generateQRCode };
