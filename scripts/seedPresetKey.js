require('dotenv').config();
const mongoose = require('mongoose');
const Theme = require('../src/models/Theme');

// liệt kê _id  ⇢  presetKey bạn muốn gán
const mapping = {
  '6824d7fcf16649c520da4674': 'pet-card-1',
  '6824d51ef16649c520da466a': 'pet-card-2',
  '6826e493f413f80331f0232b': 'pet-card-3'
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const [id, key] of Object.entries(mapping)) {
    const res = await Theme.updateOne(
      { _id: id },
      { $set: { presetKey: key } }
    );
    console.log(id, res.matchedCount ? 'UPDATED' : 'NOT FOUND');
  }

  await mongoose.disconnect();
})();
