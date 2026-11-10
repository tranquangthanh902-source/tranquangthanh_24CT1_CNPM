#!/usr/bin/env node

/**
 * Script kiểm tra database trên Railway
 * Chạy: railway run node check-db-railway.js
 * hoặc: npm run check:db:railway
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('\n' + '='.repeat(70));
console.log('🚀 KIỂM TRA CƠSỞ DỮ LIỆU TRÊN RAILWAY');
console.log('='.repeat(70) + '\n');

// Lấy DB path từ environment hoặc mặc định
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database', 'library.db');

// Hiển thị thông tin môi trường
console.log('📍 Môi trường:');
console.log(`   Node ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`   DB_PATH: ${dbPath}`);
console.log(`   App URL: ${process.env.APP_URL || 'not set'}`);
console.log(`   Port: ${process.env.PORT || '3000'}\n`);

// Kiểm tra file tồn tại
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file không tìm thấy:', dbPath);
  process.exit(1);
}

// Lấy thông tin file
const stats = fs.statSync(dbPath);
console.log('📊 Thông tin Database File:');
console.log(`   Kích thước: ${(stats.size / 1024).toFixed(2)} KB`);
console.log(`   Tạo lúc: ${stats.birthtime.toLocaleString('vi-VN')}`);
console.log(`   Chỉnh sửa lúc: ${stats.mtime.toLocaleString('vi-VN')}`);
console.log(`   Quyền: ${stats.mode.toString(8)}\n`);

try {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // ===== USERS =====
  console.log('─'.repeat(70));
  console.log('👥 USERS TABLE');
  console.log('─'.repeat(70));

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`\nTổng số tài khoản: ${userCount.count}\n`);

  const users = db.prepare(`
    SELECT id, username, full_name, email, role, 
           strftime('%d/%m/%Y %H:%M', created_at, '+7 hours') as created_at
    FROM users
    ORDER BY id
  `).all();

  users.forEach((user, i) => {
    console.log(`${i + 1}. [ID: ${user.id}] ${user.username} (${user.full_name})`);
    console.log(`   Email: ${user.email || '(chưa cập nhật)'}`);
    console.log(`   Role: ${user.role} | Đăng ký: ${user.created_at}\n`);
  });

  // ===== BOOKS =====
  console.log('─'.repeat(70));
  console.log('📖 BOOKS TABLE');
  console.log('─'.repeat(70));

  const bookCount = db.prepare('SELECT COUNT(*) as count FROM books').get();
  const bookAvail = db.prepare('SELECT SUM(available) as total FROM books').get();
  console.log(`\nTổng số sách: ${bookCount.count}`);
  console.log(`Còn có sẵn: ${bookAvail.total || 0}\n`);

  const books = db.prepare(`
    SELECT b.id, b.isbn, b.title, b.author, c.name as category, b.quantity, b.available
    FROM books b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.id DESC
    LIMIT 5
  `).all();

  console.log('5 cuốn sách mới nhất:\n');
  books.forEach((book, i) => {
    console.log(`${i + 1}. ${book.title}`);
    console.log(`   ISBN: ${book.isbn} | Tác giả: ${book.author}`);
    console.log(`   Danh mục: ${book.category || '(không xác định)'}`);
    console.log(`   Tồn kho: ${book.quantity} (Còn: ${book.available})\n`);
  });

  // ===== READERS =====
  console.log('─'.repeat(70));
  console.log('👤 READERS TABLE');
  console.log('─'.repeat(70));

  const readerCount = db.prepare('SELECT COUNT(*) as count FROM readers').get();
  console.log(`\nTổng số độc giả: ${readerCount.count}\n`);

  const readerStats = db.prepare(`
    SELECT reader_type, COUNT(*) as count 
    FROM readers 
    GROUP BY reader_type
  `).all();

  console.log('Phân loại độc giả:');
  readerStats.forEach(stat => {
    console.log(`  • ${stat.reader_type}: ${stat.count}`);
  });
  console.log();

  // ===== BORROW RECORDS =====
  console.log('─'.repeat(70));
  console.log('📤 BORROW RECORDS TABLE');
  console.log('─'.repeat(70));

  const borrowStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Đang mượn' THEN 1 ELSE 0 END) as borrowing,
      SUM(CASE WHEN status = 'Đã trả' THEN 1 ELSE 0 END) as returned,
      SUM(CASE WHEN status = 'Quá hạn' THEN 1 ELSE 0 END) as overdue
    FROM borrow_records
  `).get();

  console.log(`\nThống kê mượn sách:`);
  console.log(`  • Tổng cộng: ${borrowStats.total || 0}`);
  console.log(`  • Đang mượn: ${borrowStats.borrowing || 0}`);
  console.log(`  • Đã trả: ${borrowStats.returned || 0}`);
  console.log(`  • Quá hạn: ${borrowStats.overdue || 0}\n`);

  // ===== CATEGORIES =====
  console.log('─'.repeat(70));
  console.log('📚 CATEGORIES TABLE');
  console.log('─'.repeat(70));

  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`\nTổng số danh mục: ${catCount.count}\n`);

  // ===== DATABASE HEALTH =====
  console.log('─'.repeat(70));
  console.log('🔧 DATABASE HEALTH CHECK');
  console.log('─'.repeat(70) + '\n');

  try {
    db.prepare('PRAGMA integrity_check').all();
    console.log('✅ Integrity check: PASS');
  } catch (e) {
    console.log('⚠️ Integrity check: WARNING -', e.message);
  }

  try {
    const tables = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
    console.log(`✅ Total tables: ${tables.count}`);
  } catch (e) {
    console.log('❌ Error reading tables');
  }

  db.close();

  console.log('\n' + '='.repeat(70));
  console.log('✅ Kiểm tra hoàn thành thành công!');
  console.log('='.repeat(70) + '\n');

} catch (err) {
  console.error('\n❌ Lỗi:', err.message);
  console.error('\nStack trace:');
  console.error(err.stack);
  process.exit(1);
}
