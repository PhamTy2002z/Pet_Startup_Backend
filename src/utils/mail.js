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

const sendReminderEmail = async (to, petName, revisitDate) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: `Reminder: ${petName}'s Check-up Appointment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">Pet Check-up Reminder</h2>
        <p>Dear Pet Owner,</p>
        <p>This is a reminder that your pet <strong>${petName}</strong> has a check-up appointment scheduled for:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Date:</strong> ${revisitDate}</p>
        </div>
        <p>Please make sure to bring your pet in for their check-up at the scheduled time.</p>
        <p>If you need to reschedule, please contact us as soon as possible.</p>
        <p>Best regards,<br>Pet Care Team</p>
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
