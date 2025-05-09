const cron = require('node-cron');
const { sendReminderEmail } = require('./mail');
const Pet = require('../models/Pet'); // Import model Pet để truy vấn cơ sở dữ liệu

// Cron job để kiểm tra mỗi ngày vào lúc 00:00 (12 AM)
const startReminderJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để chỉ so sánh ngày

      // Tìm các pet có ngày tái khám trong 3 ngày tới
      const pets = await Pet.find({
        revisitDate: {
          $gte: today,
          $lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) // Tính 3 ngày sau
        }
      });

      // Duyệt qua các pet và gửi email nhắc nhở
      pets.forEach(pet => {
        const ownerEmail = pet.owner.email;
        const petName = pet.info.name;
        const revisitDate = new Date(pet.revisitDate).toISOString().split('T')[0]; // Định dạng ngày

        // Gửi email nhắc nhở
        sendReminderEmail(ownerEmail, petName, revisitDate);
      });

      console.log(`Checked pets for reminders on ${today.toISOString()}`);
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });
};

module.exports = { startReminderJob };
