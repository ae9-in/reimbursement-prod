const GeneralClaim = require('../models/GeneralClaim');
const Profile = require('../models/Profile');

// GET /api/general-claims — employees see own, admin/manager see all
exports.getGeneralClaims = async (req, res) => {
  try {
    console.log('[GeneralClaim] getGeneralClaims called, user role:', req.user.role, 'user id:', req.user.id);
    const query = req.user.role === 'employee' ? { employee_id: req.user.id } : {};
    console.log('[GeneralClaim] Query:', JSON.stringify(query));
    const claims = await GeneralClaim.find(query)
      .sort({ created_at: -1 })
      .lean();
    console.log('[GeneralClaim] Found claims count:', claims.length);
    res.json(claims);
  } catch (err) {
    console.error('[GeneralClaim] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/general-claims/:id
exports.getGeneralClaim = async (req, res) => {
  try {
    const claim = await GeneralClaim.findById(req.params.id).lean();
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/general-claims
exports.createGeneralClaim = async (req, res) => {
  try {
    console.log('[GeneralClaim] createGeneralClaim called, body:', JSON.stringify(req.body));
    const { employee_name, employee_code, department, date_of_expense, amount, category, description, receipt_url, claim_id } = req.body;
    
    const newClaim = new GeneralClaim({
      employee_id: req.user.id,
      employee_name,
      employee_code: employee_code || '',
      department,
      date_of_expense,
      amount,
      category,
      description,
      receipt_url: receipt_url || null,
      claim_id,
      status: 'Pending'
    });

    await newClaim.save();
    console.log('[GeneralClaim] Created new claim:', newClaim._id);
    res.status(201).json(newClaim);
  } catch (err) {
    console.error('[GeneralClaim] Create Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/general-claims/:id — update status (admin/manager)
exports.updateGeneralClaim = async (req, res) => {
  try {
    const updated = await GeneralClaim.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Claim not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/general-claims/:id
exports.deleteGeneralClaim = async (req, res) => {
  try {
    await GeneralClaim.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
