const Claim = require('../models/Claim');
const Profile = require('../models/Profile');

exports.getClaims = async (req, res) => {
  try {
    const query = req.user.role === 'employee' ? { employee_id: req.user.id } : {};

    // Exclude heavy gps_route_data from list view, but include receipt_url
    const claims = await Claim.find(query)
      .select('-gps_route_data')
      .sort({ created_at: -1 })
      .lean();

    // Batch-fetch all profiles in ONE query instead of one per claim (fixes N+1)
    const employeeIds = [...new Set(claims.map(c => String(c.employee_id)))];
    const profiles = await Profile.find({ user_id: { $in: employeeIds } }).lean();
    const profileMap = Object.fromEntries(profiles.map(p => [String(p.user_id), p]));

    const enrichedClaims = claims.map(claim => {
      const profile = profileMap[String(claim.employee_id)] || null;
      return { ...claim, employee_profile: profile ? { ...profile, id: profile._id } : null };
    });

    res.json(enrichedClaims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).lean();
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    
    const profile = await Profile.findOne({ user_id: claim.employee_id }).lean();
    res.json({ ...claim, employee_profile: profile ? { ...profile, id: profile._id } : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createClaim = async (req, res) => {
  try {
    const newClaim = new Claim({
      ...req.body,
      employee_id: req.user.id,
      status: req.body.status || 'draft'
    });
    await newClaim.save();
    res.status(201).json(newClaim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateClaim = async (req, res) => {
  try {
    const updated = await Claim.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteClaim = async (req, res) => {
  try {
    await Claim.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
