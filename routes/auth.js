const router=require('express').Router();
const bcrypt=require('bcrypt');
const db=require('../database/init');
const passport=require('passport');

router.get('/login',(req,res)=>res.render('login',{title:'Đăng nhập'}));
router.post('/login',(req,res)=>{
  const {username,password}=req.body;
  const user=db.prepare('SELECT * FROM users WHERE email=?').get(username);
  if(!user || !bcrypt.compareSync(password,user.password_hash)){
    req.flash('error','Email hoặc mật khẩu không đúng.');
    return res.redirect('/login');
  }
  req.session.user={id:user.id,username:user.username,full_name:user.full_name,role:user.role,email:user.email};
  req.flash('success','Đăng nhập thành công.');
  res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/');
});

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  // Successful authentication
  const user = req.user;
  req.session.user = {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    email: user.email
  };
  req.flash('success', `Đăng nhập thành công. Xin chào ${user.full_name}!`);
  res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/');
});

router.get('/logout',(req,res)=>{
  req.logout((err) => {
    if (err) {
      req.flash('error', 'Lỗi khi đăng xuất.');
      return res.redirect('/');
    }
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/');
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      req.flash('success', 'Đã đăng xuất thành công.');
      res.redirect('/');
    });
  });
});

router.get('/register',(req,res)=>res.render('register',{title:'Đăng ký'}));
router.post('/register',(req,res)=>{
  const username=(req.body.username||'').trim();
  const password=req.body.password||'';
  const full_name=(req.body.full_name||'').trim();
  const email=(req.body.email||'').trim().toLowerCase();
  if(!username||!password||!full_name){req.flash('error','Vui lòng nhập đủ thông tin.');return res.redirect('/register');}
  if(db.prepare('SELECT id FROM users WHERE username=?').get(username)){
    req.flash('error','Tên đăng nhập đã tồn tại.');
    return res.redirect('/register');
  }
  if(email && db.prepare('SELECT id FROM users WHERE email=?').get(email)){
    req.flash('error','Email đã được sử dụng.');
    return res.redirect('/register');
  }
  try{
    const hash=bcrypt.hashSync(password,10);
    db.prepare('INSERT INTO users(username,password_hash,full_name,email,role) VALUES (?,?,?,?,?)').run(username,hash,full_name,email||'','user');
    req.flash('success','Đăng ký thành công. Bạn có thể đăng nhập.');
    res.redirect('/login');
  }catch(e){req.flash('error','Không thể đăng ký tài khoản. Vui lòng thử lại.');res.redirect('/register');}
});
module.exports=router;
