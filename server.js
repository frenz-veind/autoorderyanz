require('dotenv').config();

const express       = require('express');
const mongoose      = require('mongoose');
const session       = require('express-session');
const MongoStore    = require('connect-mongo');
const morgan        = require('morgan');
const helmet        = require('helmet');
const cors          = require('cors');
const path          = require('path');
const ejsLayouts    = require('express-ejs-layouts');

const apiRoutes   = require('./routes/api');
const adminRoutes = require('./routes/admin');

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ── DB ──────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Session ─────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'yanzkhenz_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ── View Engine ─────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// ── Routes ──────────────────────────────────────────────────────
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// Home
app.get('/', (req, res) => {
  res.render('index', { layout: false });
});

// 404
app.use((req, res) => {
  res.status(404).render('404', { layout: false });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 YANZKHENZ Server running on port ${PORT}`);
});
