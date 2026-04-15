const mongoose = require('mongoose');

const GeneralClaimSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employee_name: { type: String, required: true },
  employee_code: { type: String, default: '' },
  department: { type: String, required: true },
  date_of_expense: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['Medical', 'Training', 'Office Supplies', 'Internet/Phone', 'Other'],
    required: true 
  },
  description: { type: String, required: true },
  receipt_url: { type: String },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  claim_id: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

GeneralClaimSchema.index({ employee_id: 1, created_at: -1 });
GeneralClaimSchema.index({ status: 1 });

module.exports = mongoose.models.GeneralClaim || mongoose.model('GeneralClaim', GeneralClaimSchema);
