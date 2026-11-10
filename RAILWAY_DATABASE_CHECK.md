# 🚀 Hướng dẫn Kiểm Tra Database trên Railway

## 1️⃣ CÁCH 1: Dùng Railway CLI (Dễ nhất)

### Cài đặt Railway CLI
```bash
npm install -g @railway/cli
# hoặc
choco install railway  # Windows PowerShell Admin
```

### Đăng nhập Railway
```bash
railway login
```

### Kết nối tới project
```bash
# Tại thư mục project
railway link
# Chọn project: library-management
```

### Xem logs ứng dụng
```bash
railway logs
```

### Chạy command trên Railway
```bash
# Chạy script kiểm tra database
railway run node check-db.js

# Xem environment variables
railway variables

# Xem thông tin service
railway status
```

---

## 2️⃣ CÁCH 2: SSH vào Container (Advanced)

### Kết nối SSH
```bash
railway shell
# Hoặc
railway connect

# Hoặc tìm SSH connection string từ Railway Dashboard
ssh -i ~/.ssh/key root@host
```

### Kiểm tra database trên container
```bash
# Xem DB path
echo $DB_PATH

# List files
ls -la /data/

# Kiểm tra nếu database tồn tại
file /data/library.db

# Dùng sqlite3 (nếu có cài)
sqlite3 /data/library.db ".tables"
sqlite3 /data/library.db "SELECT * FROM users;"

# Nếu không có sqlite3, install
apt-get update && apt-get install -y sqlite3
```

---

## 3️⃣ CÁCH 3: Chạy Script Node.js trên Railway

### Tạo script check-db-railway.js
```javascript
const Database = require('better-sqlite3');
const path = require('path');

// Dùng environment variable DB_PATH từ Railway
const dbPath = process.env.DB_PATH || path.join(__dirname, 'database', 'library.db');
console.log(`📊 Database path: ${dbPath}`);

try {
  const db = new Database(dbPath);

  // Check users
  const users = db.prepare('SELECT id, username, full_name, role FROM users').all();
  console.log('\n👥 Users:', users);

  // Check books
  const books = db.prepare('SELECT COUNT(*) as count FROM books').get();
  console.log('📖 Books:', books.count);

  // Check borrow records
  const borrows = db.prepare('SELECT COUNT(*) as count FROM borrow_records').get();
  console.log('📤 Borrow records:', borrows.count);

  db.close();
  console.log('\n✅ Database check completed!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
```

### Chạy script
```bash
railway run node check-db-railway.js
```

---

## 4️⃣ CÁCH 4: Xem qua Railway Dashboard

### Trong Railway Dashboard:
1. Vào Project > library-management
2. Click vào service "library-management"
3. Tab "Logs" → xem logs ứng dụng
4. Tab "Variables" → xem environment variables
5. Click nút ⚙️ → Deploy Logs → xem quá trình deploy

---

## 5️⃣ CÁCH 5: Thêm Endpoint Debug trong Code

### Thêm route kiểm tra database (tạm thời)

File: `server.js`
```javascript
// Chỉ dành cho development/debug
if (process.env.NODE_ENV !== 'production') {
  app.get('/admin/debug/db', (req, res) => {
	try {
	  const db = require('./database/init');
	  const users = db.prepare('SELECT id, username, email, role FROM users').all();
	  const books = db.prepare('SELECT COUNT(*) as count FROM books').get();
	  const readers = db.prepare('SELECT COUNT(*) as count FROM readers').get();

	  res.json({
		database: process.env.DB_PATH,
		users: users,
		stats: {
		  books: books.count,
		  readers: readers.count
		}
	  });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  });
}
```

Truy cập: `https://your-app.up.railway.app/admin/debug/db`

---

## 6️⃣ Các Lệnh SQL Kiểm Tra Phổ Biến

### Trên Railway SSH/CLI:
```bash
# Kết nối database
sqlite3 /data/library.db

# SQL queries trong sqlite3 prompt
.tables                                          # Xem bảng
.schema users                                    # Xem schema users
SELECT COUNT(*) FROM users;                      # Đếm users
SELECT * FROM users;                             # Xem tất cả users
SELECT COUNT(*) FROM books;                      # Đếm sách
SELECT COUNT(*) FROM borrow_records;             # Đếm phiếu mượn
.mode column                                     # Hiển thị dạng cột
.quit                                            # Thoát
```

---

## 7️⃣ Kiểm Tra Database Size & Storage

```bash
# Kích thước database
ls -lh /data/library.db

# Kích thước thư mục /data
du -sh /data/

# Kiểm tra dung lượng ổ đĩa
df -h /

# Xem chi tiết file
stat /data/library.db
```

---

## 8️⃣ Troubleshooting

### Database file không tìm thấy
```bash
# Railway SSH
ls -la /data/
find /app -name "*.db"

# Kiểm tra environment variables
echo $DB_PATH
echo $NODE_ENV
```

### DB_PATH chưa set
```bash
# Thêm vào Railway Variables:
DB_PATH=/data/library.db
```

### Quyền hạn file
```bash
# Check permissions
ls -l /data/library.db

# Change permissions nếu cần
chmod 644 /data/library.db
```

---

## 📋 Tóm Tắt Lệnh Thường Dùng

```bash
# 1. Kiểm tra logs
railway logs

# 2. Chạy script check
railway run node check-db.js

# 3. Vào command line
railway shell

# 4. Xem variables
railway variables

# 5. Restart app
railway redeploy

# 6. Xem status
railway status
```

---

## ⚠️ Lưu Ý Bảo Mật

✅ **DO:**
- Chỉ kiểm tra khi cần thiết
- Không share credentials công khai
- Dùng Railway Dashboard thay vì passwords

❌ **DON'T:**
- Không để database credentials trong code
- Không chạy debug endpoints trên production
- Không share SSH keys hoặc Railway tokens

---

## 🔗 Tài Liệu Tham Khảo

- Railway CLI: https://docs.railway.app/reference/cli-api
- Railway Dashboard: https://railway.app
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- SQLite: https://www.sqlite.org/cli.html
