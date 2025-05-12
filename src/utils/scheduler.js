const cron = require('node-cron');
const { sendReminderEmail } = require('./mail');
const Pet = require('../models/Pet'); // Import model Pet để truy vấn cơ sở dữ liệu

// Cron job để kiểm tra mỗi ngày vào lúc 00:00 (12 AM)
const startReminderJob = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để chỉ so sánh ngày
      
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3); // Ngày sau 3 ngày

      // Tìm tất cả pet có lịch tái khám
      const pets = await Pet.find({
        'reExaminations.date': {
          $gte: today,
          $lte: threeDaysLater
        },
        'owner.email': { $ne: '' } // Đảm bảo pet có email của chủ
      });

      console.log(`Found ${pets.length} pets with upcoming reexaminations`);

      // Duyệt qua các pet có lịch tái khám
      for (const pet of pets) {
        const ownerEmail = pet.owner.email;
        const petName = pet.info.name;
        const petSpecies = pet.info.species;
        const ownerName = pet.owner.name;
        
        // Lọc các lịch tái khám trong khoảng 3 ngày tới
        const upcomingReExaminations = pet.reExaminations.filter(reExam => {
          const examDate = new Date(reExam.date);
          return examDate >= today && examDate <= threeDaysLater;
        });
        
        // Gửi email nhắc nhở cho từng lịch tái khám
        for (const reExam of upcomingReExaminations) {
          const examDate = new Date(reExam.date).toLocaleDateString('vi-VN');
          const note = reExam.note ? ` (Ghi chú: ${reExam.note})` : '';
          
          // Gửi email nhắc nhở
          await sendReminderEmail(ownerEmail, petName, examDate + note, petSpecies, ownerName);
          console.log(`Sent reminder for pet ${petName} (${petSpecies}) to ${ownerEmail} for date ${examDate}`);
        }
      }

      console.log(`Checked pets for reminders on ${today.toISOString()}`);
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  });
};

module.exports = { startReminderJob };
