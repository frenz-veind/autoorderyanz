const express = require('express');
const router  = express.Router();
const axios   = require('axios');
const Order   = require('../models/Order');

const XENDIT_SECRET = process.env.API_KEY;
const XENDIT_AUTH   = Buffer.from(XENDIT_SECRET + ':').toString('base64');

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
      expiredAt: new Date(Date.now() + 30 * 60 * 1000)
    };

    if (paymentMethod === 'QRIS') {
      const qrisRes = await axios.post(
        'https://api.xendit.co/qr_codes',
        {
          reference_id: 'order-' + Date.now(),
          type: 'DYNAMIC',
          currency: 'IDR',
          amount: Number(productPrice)
        },
        { headers: { 'Authorization': 'Basic ' + XENDIT_AUTH, 'Content-Type': 'application/json' } }
      );

      orderData.qrisDepositId = qrisRes.data.id;
      orderData.qrisImage     = qrisRes.data.qr_string;
    }

    const order = new Order(orderData);
    await order.save();

    res.json({
      success:     true,
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

router.post('/payment/check', async (req, res) => {
  try {
    const { orderId, depositId } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });

    if (order.paymentStatus === 'paid') {
      return res.json({ success: true, status: 'paid', orderId });
    }

    const checkRes = await axios.get(
      'https://api.xendit.co/qr_codes/' + (depositId || order.qrisDepositId),
      { headers: { 'Authorization': 'Basic ' + XENDIT_AUTH } }
    );

    if (checkRes.data.status === 'ACTIVE' && checkRes.data.payments && checkRes.data.payments.length > 0) {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();
      return res.json({ success: true, status: 'paid', orderId });
    }

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

router.get('/balance', async (req, res) => {
  res.json({ success: true, data: { balance: 'Xendit Test Mode' } });
});

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
