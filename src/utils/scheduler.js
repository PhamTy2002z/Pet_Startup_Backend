//src/utils/scheduler.js
const cron                = require('node-cron');
const { sendReminderEmail } = require('./mail');
const Pet                 = require('../models/Pet');

/* -------- Core check logic -------- */
const checkForReminders = async (dryRun = false) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const threeDays = new Date(today); threeDays.setDate(today.getDate() + 3);
  threeDays.setHours(23,59,59,999);

  const pets = await Pet.find({
    reExaminations: {
      $elemMatch: {
        date: { $gte: today, $lte: threeDays },
        reminderSent: { $ne: true },
      },
    },
    'owner.email': { $exists: true, $ne: '' },
  });

  let sent = 0;
  for (const pet of pets) {
    const { email } = pet.owner;
    const petName   = pet.info.name || 'Thú cưng';
    const species   = pet.info.species || 'Không xác định';
    const ownerName = pet.owner.name || 'Quý khách';

    const needRemind = pet.reExaminations.filter(
      (r) => new Date(r.date) <= threeDays && !r.reminderSent,
    );

    for (const re of needRemind) {
      if (dryRun) {
        console.log(`[DRY-RUN] Would email ${email} for ${petName} ${re.date}`);
        continue;
      }

      await sendReminderEmail(
        email,
        petName,
        new Date(re.date).toLocaleDateString('vi-VN') + (re.note ? ` (Ghi chú: ${re.note})` : ''),
        species,
        ownerName,
      );

      /* Cập nhật cờ reminderSent */
      await Pet.updateOne(
        { _id: pet._id, 'reExaminations.date': re.date },
        { $set: { 'reExaminations.$.reminderSent': true } },
      );

      sent += 1;
    }
  }
  return { petsChecked: pets.length, remindersSent: sent };
};

/* -------- Public helpers -------- */
const checkRemindersNow = () => checkForReminders(true);

/* -------- Cron job -------- */
const startReminderJob = () => {
  console.log('[SCHEDULER] Start every 15 min Asia/Ho_Chi_Minh');
  cron.schedule('*/15 * * * *', () => {
    console.log(`[SCHEDULER] Trigger ${new Date().toISOString()}`);
    checkForReminders(false).then((r) =>
      console.log(`[SCHEDULER] Done – sent ${r.remindersSent}`),
    );
  }, { timezone: 'Asia/Ho_Chi_Minh' });
};

module.exports = { startReminderJob, checkRemindersNow };
