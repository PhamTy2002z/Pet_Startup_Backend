//src/utils/mail.js
const nodemailer = require('nodemailer');

/* ---------- Transporter ---------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',             // nếu dùng dịch vụ khác -> đổi
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* Test config ngay khi app khởi động */
(async () => {
  try {
    await transporter.verify();
    console.log('[MAIL] Transporter verified');
  } catch (err) {
    console.error('[MAIL] Transporter ERROR:', err.message);
  }
})();

/* ---------- Helpers ---------- */
const sendReminderEmail = async (
  to,
  petName,
  appointmentInfo,
  petSpecies = 'Không xác định',
  ownerName = 'Quý khách',
) => {
  if (!to || !to.includes('@')) throw new Error('Invalid email address');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px;margin:auto">
      <h2 style="color:#4a90e2">Nhắc nhở lịch tái khám</h2>
      <p>Kính gửi ${ownerName},</p>
      <p>Đây là email nhắc nhở về lịch tái khám sắp tới của thú cưng:</p>
      <div style="background:#f5f5f5;padding:15px;border-radius:5px;margin:20px 0">
        <p><strong>Tên thú cưng:</strong> ${petName}</p>
        <p><strong>Loài:</strong> ${petSpecies}</p>
        <p><strong>Ngày tái khám:</strong> ${appointmentInfo}</p>
      </div>
      <p>Vui lòng đưa thú cưng của bạn đến khám theo đúng lịch hẹn.</p>
      <p>Nếu cần thay đổi, hãy liên hệ với chúng tôi sớm nhất.</p>
      <p>Trân trọng,<br>Đội ngũ chăm sóc thú cưng</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from   : process.env.EMAIL_USER,
    to,
    subject: `Nhắc nhở: Lịch tái khám của ${petName}`,
    html,
  });

  return { success: true, messageId: info.messageId };
};

const testEmailConfig = async () => transporter.verify();

module.exports = { transporter, sendReminderEmail, testEmailConfig };
