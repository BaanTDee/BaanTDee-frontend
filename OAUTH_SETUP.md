# OAuth Setup Guide (Facebook & Google)

## วิธีตั้งค่า Social Login

### 🔵 Facebook Login

#### 1. สร้าง Facebook App
1. ไปที่ https://developers.facebook.com/
2. คลิก "My Apps" → "Create App"
3. เลือก "Consumer" → Next
4. ตั้งชื่อแอป เช่น "BaanTDee"
5. กรอก Contact Email
6. คลิก Create App

#### 2. เพิ่ม Facebook Login
1. ในหน้า Dashboard → Add Product
2. เลือก "Facebook Login" → Set Up
3. เลือก "Web"
4. กรอก Site URL: `http://localhost:3000`

#### 3. ตั้งค่า OAuth Redirect URIs
1. ไปที่ Facebook Login → Settings
2. ใน "Valid OAuth Redirect URIs" เพิ่ม:
   ```
   http://localhost:3000/api/auth/callback/facebook
   ```
3. บันทึก

#### 4. ดึง App Credentials
1. ไปที่ Settings → Basic
2. คัดลอก "App ID" และ "App Secret"
3. อัพเดทใน `.env.local`:
   ```bash
   FACEBOOK_CLIENT_ID="your_app_id_here"
   FACEBOOK_CLIENT_SECRET="your_app_secret_here"
   ```

---

### 🔴 Google Login

#### 1. สร้าง Google Cloud Project
1. ไปที่ https://console.cloud.google.com/
2. สร้าง New Project หรือเลือก Project ที่มีอยู่
3. ตั้งชื่อ Project เช่น "BaanTDee"

#### 2. เปิดใช้งาน Google+ API
1. ไปที่ "APIs & Services" → "Library"
2. ค้นหา "Google+ API"
3. คลิก Enable

#### 3. สร้าง OAuth 2.0 Credentials
1. ไปที่ "APIs & Services" → "Credentials"
2. คลิก "Create Credentials" → "OAuth client ID"
3. เลือก Application type: "Web application"
4. ตั้งชื่อ: "BaanTDee Web"

#### 4. ตั้งค่า Authorized Redirect URIs
ใน "Authorized redirect URIs" เพิ่ม:
```
http://localhost:3000/api/auth/callback/google
```

#### 5. ดึง Credentials
1. หลังสร้างเสร็จ จะได้ Client ID และ Client Secret
2. อัพเดทใน `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_client_secret_here"
   ```

#### 6. ตั้งค่า OAuth Consent Screen
1. ไปที่ "OAuth consent screen"
2. เลือก "External" → Create
3. กรอกข้อมูล:
   - App name: BaanTDee
   - User support email: your@email.com
   - Developer contact: your@email.com
4. Add Scopes: `email`, `profile`, `openid`
5. Add Test Users (ถ้ายังไม่ publish app)

---

## ✅ อัพเดท Environment Variables

เปิดไฟล์ `.env.local` และกรอกข้อมูลทั้งหมด:

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=baantdee-secret-key-change-in-production-min-32-chars

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 🚀 สำหรับ Production

เมื่อต้องการใช้จริง:

### Facebook
1. เปลี่ยน Facebook App เป็น Live Mode
2. เพิ่ม Production URL:
   ```
   https://yourdomain.com/api/auth/callback/facebook
   ```

### Google
1. Publish OAuth Consent Screen (submit for verification)
2. เพิ่ม Production URL:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

### NextAuth
```bash
NEXTAUTH_URL=https://yourdomain.com
```

---

## Backend Integration

Backend ต้องมี endpoints สำหรับรับข้อมูลจาก OAuth providers:

### POST /api/v1/auth/facebook
```go
type FacebookAuthRequest struct {
    FacebookID  string `json:"facebook_id"`
    AccessToken string `json:"access_token"`
    Name        string `json:"name"`
    Email       string `json:"email"`
}
```

### POST /api/v1/auth/google
```go
type GoogleAuthRequest struct {
    GoogleID    string `json:"google_id"`
    AccessToken string `json:"access_token"`
    Name        string `json:"name"`
    Email       string `json:"email"`
}
```

### Response (เหมือน /auth/login)
```go
type OAuthResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    User         User   `json:"user"`
}
```

---

## Testing

1. **Start Backend:**
   ```bash
   cd BaanTDee-backend
   docker-compose up
   ```

2. **Start Frontend:**
   ```bash
   cd BaanTDee-frontend
   npm run dev
   ```

3. **ทดสอบ Login:**
   - ไปที่ http://localhost:3000/login
   - คลิก "Login with Facebook" 🔵
   - คลิก "Login with Google" 🔴
   - หรือใช้ Email/Password ปกติ

---

## Troubleshooting

### Facebook: `redirect_uri_mismatch`
- ตรวจสอบ OAuth Redirect URI: `http://localhost:3000/api/auth/callback/facebook`
- ต้องตรงทุกตัวอักษร (รวม http://, port, path)

### Google: `redirect_uri_mismatch`
- ตรวจสอบ Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- ตรวจสอบใน Google Cloud Console → Credentials

### Google: "Access blocked: This app's request is invalid"
- ตรวจสอบ OAuth Consent Screen ตั้งค่าครบ
- เพิ่ม Test Users ถ้ายังไม่ publish app
- ตรวจสอบ Scopes: email, profile, openid

### Facebook: "App Not Setup: This app is still in development mode"
- ใช้ Facebook account ที่เป็น Developer/Tester ของ App
- หรือเปลี่ยน App เป็น Live Mode

---

## Email/Password Login (ไม่ต้องตั้งค่า OAuth)

ถ้าไม่ต้องการใช้ Social Login ตอนนี้ สามารถใช้ Email/Password ได้ทันที:
- ไปที่ `/register` → สมัครสมาชิกด้วยอีเมล
- ไปที่ `/login` → เข้าสู่ระบบด้วยอีเมล

Email login ใช้ backend `/auth/register` และ `/auth/login` endpoints
