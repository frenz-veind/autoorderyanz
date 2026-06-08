const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const { v4: uuidv4 } = require('uuid');

const API_BASE = process.env.API_BASE_URL;
const API_KEY  = process.env.API_KEY;

// ── POST /api/order/create ──────────────────────────────────────
router.post('/order/create', async (req, res) => {
  try {
    const {
      customerName, customerEmail, customerWhatsapp,
      productName, productCategory, productPrice, productSpecs,
      paymentMethod, notes
    } = req.body;

    if (!customerName || !customerWhatsapp || !productName || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const orderData = {
      customerName,
      customerEmail: customerEmail || '',
      customerWhatsapp,
      product: {
        name: productName,
        category: productCategory,
        price: Number(productPrice),
        specs: productSpecs || ''
      },
      paymentMethod,
      totalAmount: Number(productPrice),
      notes: notes || '',
      expiredAt: new Date(Date.now() + 30 * 60 * 1000) // 30 min
    };

    // QRIS auto payment
    if (paymentMethod === 'QRIS') {
      const qrisRes = await axios.post(
        `${API_BASE}/deposit/create`,
        { amount: Number(productPrice) },
        { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
      );

      if (!qrisRes.data.success) {
        return res.status(500).json({ success: false, message: 'Gagal membuat QRIS' });
      }

      const dep = qrisRes.data.deposit;
      orderData.qrisDepositId = dep.id;
      orderData.qrisImage     = dep.qr_image;
    }

    const order = new Order(orderData);
    await order.save();

    res.json({
      success: true,
      orderId:     order.orderId,
      qrisImage:   order.qrisImage,
      depositId:   order.qrisDepositId,
      totalAmount: order.totalAmount,
      expiredAt:   order.expiredAt
    });

  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ── POST /api/payment/check ─────────────────────────────────────
router.post('/payment/check', async (req, res) => {
  try {
    const { orderId, depositId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, status: 'paid', orderId });
    }

    // Check via QRIS API
    const checkRes = await axios.post(
      `${API_BASE}/deposit/status`,
      { deposit_id: depositId || order.qrisDepositId },
      { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
    );

    const apiStatus = checkRes.data.status;

    if (apiStatus === 'success') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();
      return res.json({ success: true, status: 'paid', orderId });
    }

    // Check expiry
    if (order.expiredAt && new Date() > order.expiredAt) {
      order.paymentStatus = 'expired';
      await order.save();
      return res.json({ success: true, status: 'expired', orderId });
    }

    res.json({ success: true, status: 'pending', orderId });

  } catch (err) {
    console.error('Check payment error:', err.message);
    res.status(500).json({ success: false, message: 'Error cek status: ' + err.message });
  }
});

// ── GET /api/balance ────────────────────────────────────────────
router.get('/balance', async (req, res) => {
  try {
    const r = await axios.post(`${API_BASE}/balance`, {}, {
      headers: { 'x-api-key': API_KEY }
    });
    res.json({ success: true, data: r.data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/order/:orderId ─────────────────────────────────────
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Tidak ditemukan' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
