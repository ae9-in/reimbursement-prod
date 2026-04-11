const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
  rate_per_km: { type: Number, required: true },
  max_distance_per_claim: { type: Number, required: true },
  max_monthly_limit: { type: Number, required: true },
  updated_at: { type: Date, default: Date.now },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Policy', PolicySchema);
