const router=require('express').Router();
const db=require('../database/init');
const {isAuthenticated}=require('../middleware/auth');

router.get('/',(req,res)=>{
  const stats={
    books:db.prepare('SELECT COALESCE(SUM(quantity),0) c FROM books').get().c,
    readers:db.prepare('SELECT COUNT(*) c FROM readers').get().c,
    borrows:db.prepare('SELECT COUNT(*) c FROM borrow_records').get().c
  };
  res.render('landing',{title:'Trang chủ',stats});
});

router.get('/admin/dashboard',isAuthenticated,(req,res)=>{
  const stats={
    books:db.prepare('SELECT COALESCE(SUM(quantity),0) c FROM books').get().c,
    readers:db.prepare('SELECT COUNT(*) c FROM readers').get().c,
    borrowing:db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE status='Đang mượn'").get().c,
    overdue:db.prepare("SELECT COUNT(*) c FROM borrow_records WHERE status='Đang mượn' AND date(due_date)<date('now')").get().c
  };
  const topBooks=db.prepare(`SELECT b.title,COUNT(br.id) total FROM borrow_records br
    JOIN books b ON b.id=br.book_id GROUP BY br.book_id ORDER BY total DESC LIMIT 5`).all();
  res.render('dashboard',{title:'Dashboard',stats,topBooks});
});
module.exports=router;
