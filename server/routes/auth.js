import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Full demo profiles, mirrored from react/src/data/mockUsers.js. Every
// field here is written to the Mongo User document on auto-create (and
// re-applied on login if a stale record is missing them) so demo logins
// show the correct entity/business identity instead of the User schema's
// generic defaults ("My Business" / "MGA / Program Manager").
const DEMO_CREDENTIALS = {
  'carrier@gmail.com': {
    password: 'admin@123', role: 'carrier', name: 'Southlake Insurance Co.',
    roleLabel: 'Risk Carrier Underwriting', entityId: 'ENT-CAR-01', entityName: 'Southlake Risk Carriers Ltd',
    businessType: 'carrier', businessLabel: 'Risk Underwriting Carrier', avatarColor: '#2563EB', initials: 'SO'
  },
  'mga@gmail.com': {
    password: 'admin@123', role: 'mga', name: 'NTA Program Administrators',
    roleLabel: 'Managing General Agent (MGA)', entityId: 'ENT-MGA-01', entityName: 'NTA Delegated Underwriters',
    businessType: 'mga', businessLabel: 'MGA / Program Manager', avatarColor: '#F97316', initials: 'NTA'
  },
  'broker@gmail.com': {
    password: 'admin@123', role: 'broker', name: 'HIT Agency Group',
    roleLabel: 'Retail Broker & Producer', entityId: 'ENT-AGY-01', entityName: 'HIT Retail Producers Inc.',
    businessType: 'agency', businessLabel: 'Retail Insurance Agency', avatarColor: '#10B981', initials: 'HIT'
  },
  'insured@gmail.com': {
    password: 'admin@123', role: 'insured', name: 'Ayushi Fleet Logistics',
    roleLabel: 'Commercial Policyholder', entityId: 'INS-AYUSHI', entityName: 'Ayushi Transport & Hauling Corp',
    businessType: 'general-business', businessLabel: 'Commercial Trucking Fleet', avatarColor: '#8B5CF6', initials: 'AY'
  },
  'admin@veridex.com': {
    password: 'admin@123', role: 'owner', name: 'Jordan Blake',
    roleLabel: 'Business Owner / Principal', entityId: 'ENT-MINE', entityName: 'My Business',
    businessType: 'mga', businessLabel: 'MGA / Program Manager', avatarColor: '#0369A1', initials: 'JB'
  },
  // Generic multi-entity demo (Pizza franchise scenario) — added alongside
  // the insurance demo profiles above, not replacing them.
  'hub@pizza.demo': {
    password: 'admin@123', role: 'hub-admin', name: 'Jordan Blake',
    roleLabel: 'Main Hub Administrator', entityId: 'ENT-HUB-01', entityName: 'Main Hub',
    businessType: 'hub', businessLabel: 'Franchise Main Hub', avatarColor: '#0369A1', initials: 'MH'
  },
  'franchise@pizza.demo': {
    password: 'admin@123', role: 'franchise-owner', name: 'Marco Rossi',
    roleLabel: 'Franchise Store Owner', entityId: 'ENT-FRN-01', entityName: 'Franchise Store #12',
    businessType: 'franchise', businessLabel: 'Franchise-Owned Store', avatarColor: '#F97316', initials: 'FS'
  },
  'ownstore@pizza.demo': {
    password: 'admin@123', role: 'ownstore-manager', name: 'Priya Nair',
    roleLabel: 'Own Store Manager', entityId: 'ENT-OWN-01', entityName: 'Own Store #1',
    businessType: 'ownstore', businessLabel: 'Company-Owned Store', avatarColor: '#10B981', initials: 'OS'
  }
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check MongoDB user
    let user = await User.findOne({ email: trimmedEmail });

    // If not found in DB but is one of our demo users, auto-create with
    // the full demo profile (entity, business type/label, avatar, etc.)
    if (!user && DEMO_CREDENTIALS[trimmedEmail]) {
      const demo = DEMO_CREDENTIALS[trimmedEmail];
      user = new User({
        email: trimmedEmail,
        name: demo.name,
        role: demo.role,
        roleLabel: demo.roleLabel,
        entityId: demo.entityId,
        entityName: demo.entityName,
        businessType: demo.businessType,
        businessLabel: demo.businessLabel,
        avatarColor: demo.avatarColor,
        initials: demo.initials,
        password: demo.password,
        status: 'Active'
      });
      await user.save().catch(() => {});
    }

    // Self-heal a demo account that was previously auto-created before this
    // fix existed (it would only have name/email/role/password/status, with
    // everything else sitting on the User schema's generic defaults).
    if (user && DEMO_CREDENTIALS[trimmedEmail]) {
      const demo = DEMO_CREDENTIALS[trimmedEmail];
      const isStale = user.entityName !== demo.entityName
        || user.businessType !== demo.businessType
        || user.businessLabel !== demo.businessLabel
        || user.entityId !== demo.entityId;
      if (isStale) {
        user.roleLabel = demo.roleLabel;
        user.entityId = demo.entityId;
        user.entityName = demo.entityName;
        user.businessType = demo.businessType;
        user.businessLabel = demo.businessLabel;
        user.avatarColor = demo.avatarColor;
        user.initials = demo.initials;
        await user.save().catch(() => {});
      }
    }

    // Verify password
    const validPassword = (user && user.password) ? user.password === password : password === 'admin@123';

    if (!user || !validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password for demo accounts is admin@123.'
      });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save().catch(() => {});

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleLabel: user.roleLabel,
        entityId: user.entityId,
        entityName: user.entityName,
        businessType: user.businessType,
        businessLabel: user.businessLabel,
        avatarColor: user.avatarColor,
        initials: user.initials
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
