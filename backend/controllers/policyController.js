const Policy = require('../models/Policy');

exports.getPolicy = async (req, res) => {
  try {
    let policy = await Policy.findOne();
    if (!policy) {
      policy = await Policy.create({ rate_per_km: 8.0, max_distance_per_claim: 500, max_monthly_limit: 5000 });
    }
    res.json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const updated = await Policy.findOneAndUpdate(
      {},
      { ...req.body, updated_at: new Date(), updated_by: req.user.id },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
