# 🔐 Authentication System Testing Guide

## 📋 Prerequisites

### 1. Environment Setup
Ensure you have a `.env.dev` file with the following configuration:

```bash
# Server
PORT=11001
NODE_ENV=dev

# Database
ENTRYTRACKING_DB_URL=mongodb://localhost:27017/shivalik_db
ENTRYTRACKING_DB_POOLSIZE=10
DB_NAME=shivalik_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_SECRET_USER=your_jwt_user_secret
JWT_VALIDITY=30d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_VALIDITY=99d

# Email (SendGrid - Recommended)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_MAIL=noreply@yourcompany.com

# OR SMTP (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 2. Install Dependencies
```bash
cd server/services/community-services
npm install
```

### 3. Start MongoDB
Ensure MongoDB is running on your system.

### 4. Start the Server
```bash
npm start
# OR for development with nodemon
nodemon src/index.js --env=dev
```

Server should start on: `http://localhost:11001`

---

## 🧪 Testing Workflow

### Test Case 1: Complete Registration Flow

#### Step 1: Register a New User
**Request:**
```bash
POST http://localhost:11001/api/v1/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "testuser@example.com",
  "mobileNumber": "9876543210",
  "countryCode": "+91",
  "password": "Test@123",
  "role": "User"
}
```

**Expected Response (201):**
```json
{
  "message": "OTP send successfully to email address.",
  "result": {
    "userId": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "testuser@example.com"
  }
}
```

**What Happens:**
- User created with status "Pending"
- 6-digit OTP generated
- OTP sent to email (valid for 10 minutes)
- Password is hashed using bcrypt

---

#### Step 2: Check Email for OTP
Open your email inbox for `testuser@example.com` and find the OTP.

Example OTP email will look like:
```
Subject: Email Verification - OTP

Hello Test User,

Your Verification Code: 123456
Valid for 10 minutes
```

---

#### Step 3: Verify OTP
**Request:**
```bash
POST http://localhost:11001/api/v1/auth/verify-otp
Content-Type: application/json

{
  "email": "testuser@example.com",
  "otp": "123456"
}
```

**Expected Response (200):**
```json
{
  "message": "OTP is verified successfully.",
  "result": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Test User",
      "email": "testuser@example.com",
      "mobileNumber": "9876543210",
      "countryCode": "+91",
      "role": "User",
      "status": "Active",
      "isEmailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "30d",
    "refreshTokenExpiry": "99d"
  }
}
```

**What Happens:**
- OTP is validated
- User status changed from "Pending" to "Active"
- Email marked as verified
- Access token and refresh token generated
- OTP and OTP expiry cleared from database

---

### Test Case 2: Login Flow

**Request:**
```bash
POST http://localhost:11001/api/v1/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "Test@123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successfully.",
  "result": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Test User",
      "email": "testuser@example.com",
      "role": "User",
      "status": "Active"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "30d",
    "refreshTokenExpiry": "99d"
  }
}
```

---

### Test Case 3: Access Protected Route

**Request:**
```bash
GET http://localhost:11001/api/v1/auth/profile
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200):**
```json
{
  "message": "Detail fetch successfully.",
  "result": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "Test User",
    "email": "testuser@example.com",
    "mobileNumber": "9876543210",
    "role": "User",
    "status": "Active",
    "isEmailVerified": true
  }
}
```

---

### Test Case 4: Refresh Access Token

**Request:**
```bash
POST http://localhost:11001/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "result": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenExpiry": "30d"
  }
}
```

---

### Test Case 5: Resend OTP

**Request:**
```bash
POST http://localhost:11001/api/v1/auth/resend-otp
Content-Type: application/json

{
  "email": "testuser@example.com"
}
```

**Expected Response (200):**
```json
{
  "message": "OTP send successfully to email address.",
  "result": {
    "email": "testuser@example.com"
  }
}
```

---

### Test Case 6: Logout

**Request:**
```bash
POST http://localhost:11001/api/v1/auth/logout
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200):**
```json
{
  "message": "Logout successfully.",
  "result": {}
}
```

**What Happens:**
- Refresh token is cleared from database
- User must login again to get new tokens

---

## ❌ Error Testing

### 1. Invalid Email Format
```bash
POST /api/v1/auth/register
{
  "email": "invalid-email"
}
```
**Response (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Please provide a valid email address",
      "param": "email"
    }
  ]
}
```

---

### 2. Weak Password
```bash
POST /api/v1/auth/register
{
  "password": "weak"
}
```
**Response (400):**
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must be at least 6 characters long"
    },
    {
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

---

### 3. Duplicate Email
```bash
POST /api/v1/auth/register
{
  "email": "existing@example.com"
}
```
**Response (400):**
```json
{
  "message": "Selected email address is already exists,please try with other.",
  "result": {}
}
```

---

### 4. Invalid OTP
```bash
POST /api/v1/auth/verify-otp
{
  "email": "testuser@example.com",
  "otp": "000000"
}
```
**Response (400):**
```json
{
  "message": "OTP is invalid.",
  "result": {}
}
```

---

### 5. Expired OTP
**Response (400):**
```json
{
  "message": "OTP is expired.",
  "result": {}
}
```

---

### 6. Login Before Email Verification
**Response (400):**
```json
{
  "message": "Please verify your email first",
  "result": {}
}
```

---

### 7. Invalid Credentials
```bash
POST /api/v1/auth/login
{
  "email": "test@example.com",
  "password": "WrongPassword123"
}
```
**Response (401):**
```json
{
  "message": "Invalid email or password",
  "result": {}
}
```

---

### 8. Access Protected Route Without Token
```bash
GET /api/v1/auth/profile
(No Authorization header)
```
**Response (401):**
```json
{
  "message": "Please provide access token",
  "result": {}
}
```

---

### 9. Access with Invalid Token
**Response (401):**
```json
{
  "message": "Unauthorized user",
  "result": {}
}
```

---

## 📊 Using Postman Collection

1. **Import Collection:**
   - Open Postman
   - Click "Import"
   - Select `Shivalik_Auth_API.postman_collection.json`

2. **Set Variables:**
   - Collection variables are auto-set
   - `base_url`: http://localhost:11001/api/v1
   - `access_token`: Auto-filled after login/verify
   - `refresh_token`: Auto-filled after login/verify

3. **Test Flow:**
   - Run requests in order (1-7)
   - Tokens are automatically saved
   - Protected routes use saved tokens

---

## 🔍 Database Verification

### Check User Creation
```javascript
// MongoDB Shell
use shivalik_db
db.users.findOne({ email: "testuser@example.com" })
```

### Check Password Hashing
Password should be hashed with bcrypt:
```javascript
{
  password: "$2a$10$ABC123..."  // Hashed, not plain text
}
```

### Check OTP Storage (Before Verification)
```javascript
{
  otp: "123456",
  otpExpiry: ISODate("2025-01-08T10:40:00.000Z"),
  status: "Pending",
  isEmailVerified: false
}
```

### Check After Verification
```javascript
{
  otp: null,
  otpExpiry: null,
  status: "Active",
  isEmailVerified: true,
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🎯 Validation Rules Summary

### Registration
- **name**: Required, 2-100 characters
- **email**: Required, valid email format, unique
- **mobileNumber**: Required, exactly 10 digits, unique
- **countryCode**: Optional, format: +XX (1-4 digits)
- **password**: Min 6 chars, uppercase, lowercase, number
- **role**: Optional, enum: User | Admin | SuperAdmin

### OTP
- **Length**: 6 digits
- **Expiry**: 10 minutes
- **Format**: Numeric only

### Tokens
- **Access Token**: 30 days validity
- **Refresh Token**: 99 days validity
- **Algorithm**: HS256 (HMAC-SHA256)

---

## 🚨 Common Issues & Solutions

### Issue 1: Email Not Received
**Solution:**
- Check SENDGRID_API_KEY or SMTP credentials
- Verify sender email is verified in SendGrid
- Check spam folder
- Look at server logs for email errors

### Issue 2: MongoDB Connection Failed
**Solution:**
- Ensure MongoDB is running
- Check ENTRYTRACKING_DB_URL in .env.dev
- Verify database name matches DB_NAME

### Issue 3: Token Invalid
**Solution:**
- Check JWT_SECRET_USER matches in .env
- Ensure token hasn't expired
- Verify Authorization header format

### Issue 4: OTP Always Invalid
**Solution:**
- Check server time zone
- Verify OTP expiry calculation
- Look for typos in OTP entry

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] MongoDB connection established
- [ ] User registration creates record
- [ ] OTP email is received
- [ ] OTP verification activates account
- [ ] Login returns tokens
- [ ] Protected route accessible with token
- [ ] Token refresh works
- [ ] Logout clears refresh token
- [ ] All validation errors work correctly
- [ ] Password is hashed in database
- [ ] Sensitive data hidden in responses

---

## 📞 Support

For issues or questions, check:
1. Server console logs
2. MongoDB logs
3. Email service logs (SendGrid dashboard)
4. .env.dev configuration

Happy Testing! 🎉
