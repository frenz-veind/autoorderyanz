const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    default: ''
  },
  customerWhatsapp: {
    type: String,
    required: true,
    trim: true
  },
  product: {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    specs: { type: String, default: '' }
  },
  paymentMethod: {
    type: String,
    enum: ['QRIS', 'DANA'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'expired', 'failed'],
    default: 'pending'
  },
  qrisDepositId: {
    type: String,
    default: null
  },
  qrisImage: {
    type: String,
    default: null
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  paidAt: {
    type: Date,
    default: null
  },
  expiredAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Auto-generate orderId
orderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `YNZ-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
