const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const claimRoutes = require('./routes/claimRoutes');
const policyRoutes = require('./routes/policyRoutes');
const commentRoutes = require('./routes/commentRoutes');
const generalClaimRoutes = require('./routes/generalClaimRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/general-claims', generalClaimRoutes);

module.exports = app;
