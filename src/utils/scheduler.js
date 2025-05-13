const cron = require('node-cron');
const { sendReminderEmail } = require('./mail');
const Pet = require('../models/Pet'); // Import model Pet để truy vấn cơ sở dữ liệu

// Function to check for reminders now (for testing)
const checkRemindersNow = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để chỉ so sánh ngày
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3); // Ngày sau 3 ngày
    threeDaysLater.setHours(23, 59, 59, 999); // Set to end of day for proper comparison

    console.log(`[TEST] Checking for appointments between ${today.toISOString()} and ${threeDaysLater.toISOString()}`);

    // Tìm tất cả pet có lịch tái khám trong khoảng thời gian
    const pets = await Pet.find({
      reExaminations: {
        $elemMatch: {
          date: {
            $gte: today,
            $lte: threeDaysLater
          }
        }
      },
      'owner.email': { $exists: true, $ne: '' } // Đảm bảo pet có email của chủ
    });

    console.log(`[TEST] Found ${pets.length} pets with upcoming reexaminations`);

    // Duyệt qua các pet có lịch tái khám
    for (const pet of pets) {
      const ownerEmail = pet.owner.email;
      const petName = pet.info.name || 'Thú cưng của bạn';
      const petSpecies = pet.info.species || 'Không xác định';
      const ownerName = pet.owner.name || 'Quý khách';
      
      // Lọc các lịch tái khám trong khoảng 3 ngày tới
      const upcomingReExaminations = pet.reExaminations.filter(reExam => {
        const examDate = new Date(reExam.date);
        return examDate >= today && examDate <= threeDaysLater;
      });
      
      // Log thông tin chi tiết
      console.log(`[TEST] Pet: ${petName}, Owner: ${ownerName}, Email: ${ownerEmail}`);
      console.log(`[TEST] Found ${upcomingReExaminations.length} upcoming appointments`);
      
      // Gửi email nhắc nhở cho từng lịch tái khám
      for (const reExam of upcomingReExaminations) {
        const examDate = new Date(reExam.date).toLocaleDateString('vi-VN');
        const note = reExam.note ? ` (Ghi chú: ${reExam.note})` : '';
        
        console.log(`[TEST] Will send reminder for date: ${examDate}`);
        
        // Gửi email nhắc nhở
        try {
          await sendReminderEmail(ownerEmail, petName, examDate + note, petSpecies, ownerName);
          console.log(`[TEST] Sent reminder for pet ${petName} (${petSpecies}) to ${ownerEmail} for date ${examDate}`);
        } catch (error) {
          console.error(`[TEST] Failed to send email to ${ownerEmail}:`, error.message);
        }
      }
    }

    console.log(`[TEST] Completed checking pets for reminders at ${new Date().toISOString()}`);
    return { success: true, petsChecked: pets.length };
  } catch (error) {
    console.error('[TEST] Error in reminder test:', error);
    return { success: false, error: error.message };
  }
};

// Cron job để kiểm tra mỗi ngày vào lúc 00:00 (12 AM)
const startReminderJob = () => {
  // For testing purposes, you can also log a message when the scheduler starts
  console.log(`Reminder scheduler started at ${new Date().toISOString()}`);
  
  cron.schedule('0 0 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Đặt thời gian về 00:00:00 để chỉ so sánh ngày
      
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3); // Ngày sau 3 ngày
      threeDaysLater.setHours(23, 59, 59, 999); // Set to end of day for proper comparison

      console.log(`Checking for appointments between ${today.toISOString()} and ${threeDaysLater.toISOString()}`);

      // Tìm tất cả pet có lịch tái khám trong khoảng thời gian
      const pets = await Pet.find({
        reExaminations: {
          $elemMatch: {
            date: {
              $gte: today,
              $lte: threeDaysLater
            }
          }
        },
        'owner.email': { $exists: true, $ne: '' } // Đảm bảo pet có email của chủ
      });

      console.log(`Found ${pets.length} pets with upcoming reexaminations`);

      // Duyệt qua các pet có lịch tái khám
      for (const pet of pets) {
        const ownerEmail = pet.owner.email;
        const petName = pet.info.name || 'Thú cưng của bạn';
        const petSpecies = pet.info.species || 'Không xác định';
        const ownerName = pet.owner.name || 'Quý khách';
        
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

      console.log(`Completed checking pets for reminders on ${today.toISOString()}`);
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  });
};

module.exports = { startReminderJob, checkRemindersNow };
