exports.isAuthenticated = (req,res,next)=>{
  if(req.session.user) return next();
  req.flash('error','Vui lòng đăng nhập để tiếp tục.');
  res.redirect('/login');
};

exports.isAdmin = (req,res,next)=>{
  if(req.session.user?.role==='admin') return next();
  req.flash('error','Bạn không có quyền truy cập khu vực quản trị.');
  res.redirect('/');
};
