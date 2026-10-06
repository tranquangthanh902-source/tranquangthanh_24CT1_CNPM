const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const db = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'library-management-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/search', require('./routes/search'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'library-management' });
});

const auth = require('./middleware/auth');
app.use('/admin', auth.isAuthenticated, auth.isAdmin);
app.use('/admin/books', require('./routes/books'));
app.use('/admin/readers', require('./routes/readers'));
app.use('/admin/borrow', require('./routes/borrow'));
app.use('/admin/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).render('404', { title: 'Không tìm thấy trang' }));

app.listen(PORT, () => {
  console.log(`\nThư Viện Số đang chạy tại: http://localhost:${PORT}`);
  console.log('Tài khoản mặc định: admin / admin123\n');
});
