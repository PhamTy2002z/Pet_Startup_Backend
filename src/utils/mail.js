const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Nếu bạn dùng Gmail, nếu dùng dịch vụ khác cần cấu hình khác
  auth: {
    user: process.env.EMAIL_USER, // Tài khoản email của bạn
    pass: process.env.EMAIL_PASS  // App password của bạn
  }
});

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email configuration is valid!');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

const sendReminderEmail = async (to, petName, appointmentInfo) => {
  // Check if email is valid
  if (!to || !to.includes('@')) {
    console.error('Invalid email address:', to);
    return { success: false, error: 'Invalid email address' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: `Nhắc nhở: Lịch tái khám của ${petName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">Nhắc nhở lịch tái khám</h2>
        <p>Kính gửi chủ thú cưng,</p>
        <p>Đây là email nhắc nhở về lịch tái khám sắp tới của thú cưng <strong>${petName}</strong>:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Ngày tái khám:</strong> ${appointmentInfo}</p>
        </div>
        <p>Vui lòng đưa thú cưng của bạn đến khám theo đúng lịch hẹn.</p>
        <p>Nếu bạn cần thay đổi lịch hẹn, hãy liên hệ với chúng tôi càng sớm càng tốt.</p>
        <p>Trân trọng,<br>Đội ngũ chăm sóc thú cưng</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { 
  sendReminderEmail,
  testEmailConfig
};
