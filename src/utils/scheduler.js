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

// Common function for checking reminders to avoid code duplication
const checkForReminders = async (isTest = false) => {
  const logPrefix = isTest ? '[TEST]' : '[SCHEDULED]';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);

    console.log(`${logPrefix} Checking for appointments between ${today.toISOString()} and ${threeDaysLater.toISOString()}`);

    // Find all pets with upcoming re-examinations that have not been reminded yet
    const pets = await Pet.find({
      reExaminations: {
        $elemMatch: {
          date: {
            $gte: today,
            $lte: threeDaysLater
          },
          reminderSent: { $ne: true } // Only get appointments where reminder hasn't been sent
        }
      },
      'owner.email': { $exists: true, $ne: '' }
    });

    console.log(`${logPrefix} Found ${pets.length} pets with upcoming reexaminations needing reminders`);

    let remindersSent = 0;

    for (const pet of pets) {
      const ownerEmail = pet.owner.email;
      const petName = pet.info.name || 'Thú cưng của bạn';
      const petSpecies = pet.info.species || 'Không xác định';
      const ownerName = pet.owner.name || 'Quý khách';
      
      // Filter for upcoming re-examinations that haven't been reminded yet
      const upcomingReExaminations = pet.reExaminations.filter(reExam => {
        const examDate = new Date(reExam.date);
        return examDate >= today && 
               examDate <= threeDaysLater && 
               reExam.reminderSent !== true; // Only include non-reminded appointments
      });
      
      if (isTest) {
        console.log(`${logPrefix} Pet: ${petName}, Owner: ${ownerName}, Email: ${ownerEmail}`);
        console.log(`${logPrefix} Found ${upcomingReExaminations.length} upcoming appointments needing reminders`);
      }
      
      for (const reExam of upcomingReExaminations) {
        const examDate = new Date(reExam.date).toLocaleDateString('vi-VN');
        const note = reExam.note ? ` (Ghi chú: ${reExam.note})` : '';
        
        if (isTest) {
          console.log(`${logPrefix} Will send reminder for date: ${examDate}`);
        }
        
        try {
          await sendReminderEmail(ownerEmail, petName, examDate + note, petSpecies, ownerName);
          console.log(`${logPrefix} Sent reminder for pet ${petName} (${petSpecies}) to ${ownerEmail} for date ${examDate}`);
          
          // Mark this re-examination as reminded in the database
          await Pet.updateOne(
            { 
              _id: pet._id,
              "reExaminations.date": reExam.date 
            },
            { 
              $set: { "reExaminations.$.reminderSent": true } 
            }
          );
          console.log(`${logPrefix} Marked reminder as sent in the database`);
          remindersSent++;
        } catch (error) {
          console.error(`${logPrefix} Failed to send email to ${ownerEmail}:`, error.message);
        }
      }
    }

    console.log(`${logPrefix} Completed checking pets for reminders at ${new Date().toISOString()}`);
    console.log(`${logPrefix} Sent ${remindersSent} reminders in total`);
    return { success: true, petsChecked: pets.length, remindersSent };
  } catch (error) {
    console.error(`${logPrefix} Error in reminder check:`, error);
    return { success: false, error: error.message };
  }
};

// Cron job để kiểm tra mỗi ngày vào lúc 9:00 AM (giờ Việt Nam)
const startReminderJob = () => {
  console.log(`Reminder scheduler started at ${new Date().toISOString()}`);
  console.log('Scheduler will run daily at 9:00 AM (Asia/Ho_Chi_Minh time)');
  
  // Run immediately on startup to test the system
  console.log('Running initial check on startup...');
  checkForReminders(false).then(result => {
    console.log('Initial check result:', result);
  });

  // Schedule the daily job to run at 9:00 AM Vietnam time
  const job = cron.schedule('0 9 * * *', async () => {
    console.log(`[SCHEDULED] Auto reminder triggered at ${new Date().toISOString()}`);
    await checkForReminders(false);
  }, {
    scheduled: true,
    timezone: 'Asia/Ho_Chi_Minh'
  });
  
  // Ensure the job is running
  if (job.running) {
    console.log('Reminder scheduler is running successfully');
  } else {
    console.error('WARNING: Reminder scheduler failed to start');
    // Try to start it manually
    job.start();
    console.log('Attempted to manually start the scheduler');
  }
  
  return job;
};

module.exports = { startReminderJob, checkRemindersNow };
