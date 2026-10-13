const router=require('express').Router();
const db=require('../database/init');

// GET /admin/users - list all users
router.get('/',(req,res)=>{
  try{
    const users=db.prepare(`
      SELECT id, username, full_name, email, role, 
             strftime('%d/%m/%Y %H:%M', created_at, '+7 hours') as created_at_display
      FROM users 
      ORDER BY created_at DESC
    `).all();
    res.render('users/index',{title:'Quản lý tài khoản',users,currentUser:req.session.user});
  }catch(e){
    req.flash('error','Không thể tải danh sách tài khoản.');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/users/edit/:id - edit user form
router.get('/edit/:id',(req,res)=>{
  try{
    const user=db.prepare(`
      SELECT id, username, full_name, email, role, 
             strftime('%d/%m/%Y %H:%M', created_at, '+7 hours') as created_at_display
      FROM users 
      WHERE id=?
    `).get(req.params.id);
    if(!user){
      req.flash('error','Tài khoản không tồn tại.');
      return res.redirect('/admin/users');
    }
    res.render('users/edit',{title:'Chỉnh sửa tài khoản',user,currentUser:req.session.user});
  }catch(e){
    req.flash('error','Không thể tải tài khoản.');
    res.redirect('/admin/users');
  }
});

// POST /admin/users/edit/:id - update user
router.post('/edit/:id',(req,res)=>{
  try{
    const userId=parseInt(req.params.id);
    const {full_name,email,role}=req.body;
    const full_name_trim=(full_name||'').trim();
    const email_trim=(email||'').trim().toLowerCase();
    const role_input=(role||'user').toLowerCase();

    if(!full_name_trim){
      req.flash('error','Tên đầy đủ không được để trống.');
      return res.redirect(`/admin/users/edit/${userId}`);
    }

    if(!['admin','user'].includes(role_input)){
      req.flash('error','Vai trò không hợp lệ.');
      return res.redirect(`/admin/users/edit/${userId}`);
    }

    // Prevent self-deletion of admin
    if(req.session.user.id===userId && role_input==='user'){
      req.flash('error','Không thể tự thay đổi vai trò của chính mình.');
      return res.redirect(`/admin/users/edit/${userId}`);
    }

    // Check if email already exists for another user
    if(email_trim){
      const existingEmail=db.prepare('SELECT id FROM users WHERE email=? AND id!=?').get(email_trim,userId);
      if(existingEmail){
        req.flash('error','Email này đã được sử dụng bởi tài khoản khác.');
        return res.redirect(`/admin/users/edit/${userId}`);
      }
    }

    db.prepare('UPDATE users SET full_name=?, email=?, role=? WHERE id=?')
      .run(full_name_trim,email_trim||'',role_input,userId);
    req.flash('success','Cập nhật tài khoản thành công.');
    res.redirect('/admin/users');
  }catch(e){
    req.flash('error','Không thể cập nhật tài khoản. Vui lòng thử lại.');
    res.redirect('/admin/users');
  }
});

// POST /admin/users/delete/:id - delete user
router.post('/delete/:id',(req,res)=>{
  try{
    const userId=parseInt(req.params.id);

    // Prevent deleting self
    if(req.session.user.id===userId){
      req.flash('error','Không thể xóa tài khoản của chính mình.');
      return res.redirect('/admin/users');
    }

    // Prevent deleting the only admin
    const adminCount=db.prepare('SELECT COUNT(*) as count FROM users WHERE role=?').get('admin').count;
    const userRole=db.prepare('SELECT role FROM users WHERE id=?').get(userId);

    if(userRole && userRole.role==='admin' && adminCount===1){
      req.flash('error','Không thể xóa admin cuối cùng.');
      return res.redirect('/admin/users');
    }

    db.prepare('DELETE FROM users WHERE id=?').run(userId);
    req.flash('success','Xóa tài khoản thành công.');
    res.redirect('/admin/users');
  }catch(e){
    req.flash('error','Không thể xóa tài khoản. Vui lòng thử lại.');
    res.redirect('/admin/users');
  }
});

module.exports=router;
