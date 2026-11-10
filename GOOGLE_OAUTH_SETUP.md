# Hướng dẫn cấu hình Google OAuth để đăng nhập bằng Gmail

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới atau chọn project hiện có
3. Bật **Google+ API**:
   - Vào "APIs & Services" > "Library"
   - Tìm "Google+ API"
   - Click "Enable"

## Bước 2: Tạo OAuth 2.0 Credentials

1. Vào "APIs & Services" > "Credentials"
2. Click "+ Create Credentials" > "OAuth client ID"
3. Chọn "Web application"
4. Thêm Authorized redirect URIs:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`
5. Copy **Client ID** và **Client Secret**

## Bước 3: Cấu hình Environment Variables

### Local (Development):
Tạo file `.env` hoặc đặt biến môi trường:
```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
APP_URL=http://localhost:3000
NODE_ENV=development
```

### Railway (Production):
1. Vào Railway Dashboard
2. Chọn project
3. Variables > Add variable
4. Thêm:
   - `GOOGLE_CLIENT_ID` = Client ID từ Google Cloud
   - `GOOGLE_CLIENT_SECRET` = Client Secret từ Google Cloud
   - `APP_URL` = Public URL của ứng dụng (VD: https://library-management-production-xxx.up.railway.app)
   - `NODE_ENV` = production

## Bước 4: Cài đặt Dependencies

Dependencies đã được thêm vào package.json:
- `passport`: ^0.7.0
- `passport-google-oauth20`: ^2.0.0

Chạy:
```bash
npm install
```

## Bước 5: Kiểm tra Hoạt động

1. Khởi động ứng dụng
2. Truy cập `/login`
3. Click nút "Đăng nhập bằng Gmail"
4. Chọn tài khoản Gmail và cấp quyền
5. Hệ thống sẽ tự động tạo tài khoản và đăng nhập

## Quy trình Hoạt động

1. **First-time Login**: 
   - User click "Đăng nhập bằng Gmail"
   - Google xác thực
   - Hệ thống kiểm tra email trong DB
   - Nếu chưa có → Tạo tài khoản mới (role='user')
   - Lưu session và redirect

2. **Existing User**: 
   - User click "Đăng nhập bằng Gmail"
   - Google xác thực
   - Hệ thống tìm kiếm email trong DB
   - Đã có → Đăng nhập trực tiếp

## Lưu ý Bảo mật

- Client Secret phải giữ bí mật (không commit vào Git)
- Luôn sử dụng HTTPS trong production
- Callback URL phải khớp chính xác trên Google Cloud Console
- Email là unique identifier cho OAuth users

## Troubleshooting

**Lỗi "Redirect URI mismatch"**:
- Kiểm tra `APP_URL` environment variable
- Đảm bảo callback URL khớp trên Google Cloud Console

**Email bị lỗi**:
- Kiểm tra email trong Google Account Public Profile

**Session không lưu**:
- Đảm bảo SESSION_SECRET được set
- Kiểm tra cookie settings (secure, httpOnly, sameSite)
