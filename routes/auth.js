const router=require('express').Router();
const bcrypt=require('bcrypt');
const db=require('../database/init');

router.get('/login',(req,res)=>res.render('login',{title:'Đăng nhập'}));
router.post('/login',(req,res)=>{
  const {username,password}=req.body;
  const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!user || !bcrypt.compareSync(password,user.password_hash)){
    req.flash('error','Tên đăng nhập hoặc mật khẩu không đúng.');
    return res.redirect('/login');
  }
  req.session.user={id:user.id,username:user.username,full_name:user.full_name,role:user.role};
  req.flash('success','Đăng nhập thành công.');
  res.redirect('/admin/dashboard');
});
router.get('/logout',(req,res)=>{
  req.session.destroy(()=>res.redirect('/'));
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
    db.prepare('INSERT INTO users(username,password_hash,full_name,email) VALUES (?,?,?,?)').run(username,hash,full_name,email||'');
    req.flash('success','Đăng ký thành công. Bạn có thể đăng nhập.');
    res.redirect('/login');
  }catch(e){req.flash('error','Không thể đăng ký tài khoản. Vui lòng thử lại.');res.redirect('/register');}
});
module.exports=router;
