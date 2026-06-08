const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const { isAuthenticated, isGuest } = require('../middleware/auth');

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'yanz123';

// ── GET /admin/login ────────────────────────────────────────────
router.get('/login', isGuest, (req, res) => {
  res.render('admin/login', { error: null, layout: false });
});

// ── POST /admin/login ───────────────────────────────────────────
router.post('/login', isGuest, (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = { username };
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: 'Username atau password salah!', layout: false });
});

// ── GET /admin/logout ───────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── GET /admin/dashboard ────────────────────────────────────────
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const [totalOrders, paidOrders, pendingOrders, recentOrders] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'paid' }),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.find().sort({ createdAt: -1 }).limit(10)
    ]);

    // Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    // Monthly chart data (last 7 days)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const count = await Order.countDocuments({ createdAt: { $gte: d, $lte: end } });
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      last7.push({ label, count });
    }

    res.render('admin/dashboard', {
      layout: 'admin/layout',
      admin: req.session.admin,
      stats: { totalOrders, paidOrders, pendingOrders, revenue },
      recentOrders,
      chartData: JSON.stringify(last7),
      page: 'dashboard'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// ── GET /admin/orders ───────────────────────────────────────────
router.get('/orders', isAuthenticated, async (req, res) => {
  try {
    const { search, status, page: pg } = req.query;
    const page  = parseInt(pg) || 1;
    const limit = 15;

    const filter = {};
    if (status && status !== 'all') filter.paymentStatus = status;
    if (search) {
      filter.$or = [
        { orderId:           { $regex: search, $options: 'i' } },
        { customerName:      { $regex: search, $options: 'i' } },
        { customerWhatsapp:  { $regex: search, $options: 'i' } },
        { 'product.name':    { $regex: search, $options: 'i' } }
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter)
    ]);

    res.render('admin/orders', {
      layout: 'admin/layout',
      admin: req.session.admin,
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
      search: search || '',
      status: status || 'all',
      page_name: 'orders'
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ── POST /admin/orders/delete ───────────────────────────────────
router.post('/orders/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /admin/orders/mark-paid ────────────────────────────────
router.post('/orders/mark-paid/:id', isAuthenticated, async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, {
      paymentStatus: 'paid',
      paidAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
