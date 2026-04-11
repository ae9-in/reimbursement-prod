const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date_of_travel: { type: String, required: true },
  distance_km: { type: Number, required: true },
  purpose: { type: String, required: true },
  odometer_start: { type: Number },
  odometer_end: { type: Number },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'manager_approved', 'rejected', 'paid'],
    default: 'draft'
  },
  amount_calculated: { type: Number, required: true },
  receipt_url: { type: String },
  gps_route_data: { type: mongoose.Schema.Types.Mixed },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Claim', ClaimSchema);
