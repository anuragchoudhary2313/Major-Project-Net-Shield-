import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Log } from './models/Log.js';
import { Alert } from './models/Alert.js';
import { Report } from './models/Report.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.status(201).json({ user: { id: user._id, email: user.email, role: user.role, settings: user.settings }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
    res.json({ user: { id: user._id, email: user.email, role: user.role, settings: user.settings }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/auth/me', authenticate, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json({ id: user._id, email: user.email, role: user.role, settings: user.settings, created_at: user.createdAt });
});

// Data Routes
app.get('/api/logs', authenticate, async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 }).limit(1000);
  res.json(logs.map(l => ({ ...l.toObject(), id: l._id })));
});

app.get('/api/alerts', authenticate, async (req, res) => {
  const alerts = await Alert.find().sort({ timestamp: -1 });
  res.json(alerts.map(a => ({ ...a.toObject(), id: a._id })));
});

app.patch('/api/alerts/:id', authenticate, async (req, res) => {
  const { status } = req.body;
  const update = { status };
  if (status === 'resolved') {
    update.resolved_at = new Date();
    update.resolved_by = req.user.id;
  }
  const alert = await Alert.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json(alert);
});

app.get('/api/dashboard', authenticate, async (req, res) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const [totalPackets, activeAlerts, packetsToday, recentTraffic] = await Promise.all([
    Log.countDocuments(),
    Alert.countDocuments({ status: 'unresolved' }),
    Log.countDocuments({ timestamp: { $gte: today } }),
    Log.find().sort({ timestamp: -1 }).limit(50)
  ]);
  
  const criticalCount = await Alert.countDocuments({ status: 'unresolved', severity: { $in: ['critical', 'high'] } });
  const threatLevel = criticalCount > 0 ? 'high' : activeAlerts > 5 ? 'medium' : 'low';

  res.json({ totalPackets, activeAlerts, threatLevel, packetsToday, recentTraffic: recentTraffic.map(t => ({...t.toObject(), id: t._id})) });
});

app.put('/api/settings', authenticate, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { settings: req.body }, { new: true });
  res.json(user.settings);
});

app.get('/api/reports', authenticate, async (req, res) => {
  const reports = await Report.find().sort({ generated_at: -1 });
  res.json(reports.map(r => ({ ...r.toObject(), id: r._id })));
});

app.post('/api/reports/generate', authenticate, async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [packetsCount, alerts] = await Promise.all([
    Log.countDocuments({ timestamp: { $gte: weekAgo } }),
    Alert.find({ timestamp: { $gte: weekAgo } })
  ]);

  const severityBreakdown = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  const threatTypes = {};
  alerts.forEach(a => threatTypes[a.threat_type] = (threatTypes[a.threat_type] || 0) + 1);

  const report = await Report.create({
    title: `Weekly Security Report - ${now.toLocaleDateString()}`,
    summary: `Analysis from ${weekAgo.toLocaleDateString()} to ${now.toLocaleDateString()}. ${packetsCount} packets, ${alerts.length} alerts.`,
    total_packets: packetsCount,
    total_alerts: alerts.length,
    severity_breakdown: severityBreakdown,
    threat_types: threatTypes,
    date_from: weekAgo,
    date_to: now,
    generated_by: req.user.id,
    user_id: req.user.id
  });

  res.json(report);
});

app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));