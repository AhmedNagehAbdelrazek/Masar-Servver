# Masar API - Authentication & Onboarding Guide

## Overview

This document covers the complete auth flow for the Masar ride-sharing platform, including registration, login, password recovery, and driver onboarding.

**Base URL:** `http://localhost:8000/api`

**Authentication:** JWT Bearer tokens in the `Authorization` header.

---

## Table of Contents

1. [Registration Flow](#1-registration-flow)
2. [Login](#2-login)
3. [Token Refresh](#3-token-refresh)
4. [Logout](#4-logout)
5. [Get Profile](#5-get-profile)
6. [Forgot Password Flow](#6-forgot-password-flow)
7. [Resend OTP](#7-resend-otp)
8. [Driver Onboarding](#8-driver-onboarding)

---

## 1. Registration Flow

Registration is a **3-step process** for `passenger` or `driver` roles.

### Step 1: Send Phone → Get OTP

```
POST /api/auth/register/phone
```

**Request Body:**
```json
{
  "country_code": "JO",
  "phone": "791234567",
  "role": "driver"
}
```

| Field        | Type   | Required | Description                                    |
| ------------ | ------ | -------- | ---------------------------------------------- |
| country_code | string | Yes      | 2-letter ISO country code (e.g., JO, AE, SA)   |
| phone        | string | Yes      | Local phone number (without country dial code)  |
| role         | string | Yes      | Either `passenger` or `driver`                  |

**Phone Validation:**
- The `country_code` is used to look up the dial code and expected phone length from our phone codes database.
- For Jordan (`JO`): dial code is `+962`, phone must be **9 digits**.
- For UAE (`AE`): dial code is `+971`, phone must be **9 digits**.
- The phone is stored in full format: `+962791234567`.

**Success Response (201):**
```json
{
  "message": "OTP sent successfully"
}
```

**Error Responses:**
- `409` - Phone already registered
- `422` - Validation error (invalid country code, wrong phone length, invalid role)

> **Note:** The OTP is logged to the console during development. Check your server logs.

---

### Step 2: Verify OTP → Get Registration Token

```
POST /api/auth/register/verify-otp
```

**Request Body:**
```json
{
  "phone": "+962791234567",
  "otp": "123456"
}
```

| Field  | Type   | Required | Description                    |
| ------ | ------ | -------- | ------------------------------ |
| phone  | string | Yes      | Full phone number with dial code |
| otp    | string | Yes      | 6-digit OTP from console       |

**Success Response (201):**
```json
{
  "registration_token": "eyJhbGciOiJIUzI1NiIs...",
  "phone": "+962791234567"
}
```

**Error Responses:**
- `400` - OTP expired, max attempts exceeded, or invalid OTP
- `409` - Phone already registered

> **Important:** The `registration_token` is a short-lived JWT (10 minutes) that can only be used **once**. Use it immediately in Step 3.

---

### Step 3: Set Password → Get JWT Tokens

```
POST /api/auth/register/password
```

**Headers:**
```
Authorization: Bearer <registration_token>
```

**Request Body:**
```json
{
  "password": "MySecure@123",
  "confirmPassword": "MySecure@123"
}
```

| Field          | Type   | Required | Description                          |
| -------------- | ------ | -------- | ------------------------------------ |
| password       | string | Yes      | Min 8 chars, uppercase, lowercase, number, special char |
| confirmPassword| string | Yes      | Must match password                  |

**Password Requirements:**
- At least 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

**Success Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "phone": "+962791234567",
    "countryCode": "JO",
    "role": "driver",
    "fullName": null,
    "isVerified": false
  }
}
```

> **Save both tokens!** Use `access_token` for authenticated requests. Use `refresh_token` to get new tokens when the access token expires.

---

## 2. Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "phone": "+962791234567",
  "password": "MySecure@123"
}
```

| Field    | Type   | Required | Description              |
| -------- | ------ | -------- | ------------------------ |
| phone    | string | Yes      | Full phone with dial code |
| password | string | Yes      | Account password         |

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "phone": "+962791234567",
    "countryCode": "JO",
    "role": "driver",
    "fullName": "Ahmad",
    "isVerified": true
  }
}
```

**Error Responses:**
- `401` - Invalid phone or password
- `403` - Account banned or suspended

---

## 3. Token Refresh

When your access token expires, use the refresh token to get a new pair.

```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "access_token": "new-access-token...",
  "refresh_token": "new-refresh-token..."
}
```

> **Note:** The old refresh token is invalidated. Always store the new refresh token.

---

## 4. Logout

```
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

> The refresh token is revoked. The access token remains valid until expiry.

---

## 5. Get Profile

```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": "uuid-here",
  "phone": "+962791234567",
  "countryCode": "JO",
  "fullName": "Ahmad Mohammed",
  "email": "ahmad@example.com",
  "role": "driver",
  "gender": "male",
  "age": 28,
  "avatarUrl": "https://...",
  "isVerified": true,
  "avgRating": 4.8,
  "status": "active",
  "locale": "ar"
}
```

---

## 6. Forgot Password Flow

A **3-step process** to reset a forgotten password.

### Step 1: Request OTP

```
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "phone": "+962791234567"
}
```

**Success Response (200):**
```json
{
  "message": "If the phone number is registered, an OTP has been sent"
}
```

> **Security:** The response is always the same whether the phone exists or not, to prevent phone enumeration.

---

### Step 2: Verify OTP → Get Reset Token

```
POST /api/auth/forgot-password/verify-otp
```

**Request Body:**
```json
{
  "phone": "+962791234567",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "reset_token": "eyJhbGciOiJIUzI1NiIs...",
  "phone": "+962791234567"
}
```

---

### Step 3: Reset Password

```
POST /api/auth/forgot-password/reset
```

**Headers:**
```
Authorization: Bearer <reset_token>
```

**Request Body:**
```json
{
  "password": "NewSecure@123",
  "confirmPassword": "NewSecure@123"
}
```

**Success Response (200):**
```json
{
  "message": "Password reset successful"
}
```

> **Note:** After password reset, all existing refresh tokens for this user are revoked. The user must log in again on all devices.

---

## 7. Resend OTP

```
POST /api/auth/resend-otp
```

**Request Body:**
```json
{
  "phone": "+962791234567",
  "purpose": "register"
}
```

| Field   | Type   | Required | Description                              |
| ------- | ------ | -------- | ---------------------------------------- |
| phone   | string | Yes      | Full phone number with dial code          |
| purpose | string | Yes      | Either `register` or `forgot_password`    |

**Success Response (200):**
```json
{
  "message": "OTP resent successfully"
}
```

---

## 8. Driver Onboarding

After registration, drivers must complete two onboarding steps. All image IDs come from the upload endpoint (`POST /api/upload`).

### Check Onboarding Status

```
GET /api/auth/onboarding/status
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "role": "driver",
  "passwordSet": true,
  "profileSubmitted": false,
  "profileVerified": false,
  "vehicleSubmitted": false,
  "vehicleVerified": false,
  "fullyVerified": false
}
```

---

### Step 1: Submit Driver Profile

```
POST /api/auth/onboarding/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "fullName": "Ahmad Mohammed Al-Khatib",
  "age": 28,
  "gender": "male",
  "userIdentificationFront": 1,
  "userIdentificationBack": 2,
  "linceseFront": 3,
  "linceseBack": 4,
  "personalImageWithId": 5
}
```

| Field                    | Type    | Required | Description                           |
| ------------------------ | ------- | -------- | ------------------------------------- |
| fullName                 | string  | Yes      | Max 120 characters                    |
| age                      | integer | Yes      | Between 18 and 100                    |
| gender                   | string  | Yes      | `male` or `female`                      |
| userIdentificationFront  | integer | Yes      | Image ID of front of national ID      |
| userIdentificationBack   | integer | Yes      | Image ID of back of national ID       |
| linceseFront             | integer | Yes      | Image ID of front of driving license  |
| linceseBack              | integer | Yes      | Image ID of back of driving license   |
| personalImageWithId      | integer | Yes      | Image ID of selfie holding ID         |

**Success Response (201):**
```json
{
  "driverProfile": {
    "id": "uuid",
    "driverId": "user-uuid",
    "idVerified": false,
    "subscriptionTier": "free",
    "totalTrips": 0,
    "totalEarnings": 0,
    "responseRate": 100
  }
}
```

> **Note:** The profile is submitted with `idVerified: false`. An admin must review and verify the documents.

---

### Get Driver Profile

```
GET /api/auth/onboarding/profile
```

**Headers:**
```
Authorization: Bearer <access_token>
```

---

### Step 2: Submit Vehicle

```
POST /api/auth/onboarding/vehicle
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "vehicleType": "sedan",
  "manufacturer": "Toyota",
  "model": "Camry",
  "modelYear": 2023,
  "color": "White",
  "plateNumber": "ABC-1234",
  "seats": 4,
  "registrationDocFront": 6,
  "registrationDocBack": 7,
  "vehiclePhotoFront": 8,
  "vehiclePhotoBack": 9
}
```

| Field                | Type    | Required | Description                           |
| -------------------- | ------- | -------- | ------------------------------------- |
| vehicleType          | string  | Yes      | `sedan`, `suv`, `van`, `bus`, `hatchback` |
| manufacturer         | string  | Yes      | e.g., Toyota, Honda, Ford             |
| model                | string  | Yes      | e.g., Camry, Civic                    |
| modelYear            | integer | No       | e.g., 2023                            |
| color                | string  | No       | e.g., White, Black                    |
| plateNumber          | string  | Yes      | Unique plate number                   |
| seats                | integer | Yes      | Between 1 and 50                      |
| registrationDocFront | integer | Yes      | Image ID of front registration doc    |
| registrationDocBack  | integer | Yes      | Image ID of back registration doc     |
| vehiclePhotoFront    | integer | Yes      | Image ID of vehicle front             |
| vehiclePhotoBack     | integer | Yes      | Image ID of vehicle back              |

**Success Response (201):**
```json
{
  "vehicle": {
    "id": "uuid",
    "driverId": "user-uuid",
    "vehicleType": "sedan",
    "manufacturer": "Toyota",
    "model": "Camry",
    "plateNumber": "ABC-1234",
    "isVerified": false
  }
}
```

---

### Get Vehicle

```
GET /api/auth/onboarding/vehicle
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "vehicles": [
    {
      "id": "uuid",
      "vehicleType": "sedan",
      "manufacturer": "Toyota",
      "model": "Camry",
      "plateNumber": "ABC-1234",
      "isVerified": false
    }
  ]
}
```

---

## Complete Flow Summary

### New Driver Registration

```
1. POST /auth/register/phone          { country_code, phone, role }
2. POST /auth/register/verify-otp     { phone, otp }
3. POST /auth/register/password       { password, confirmPassword }  ← Bearer: registration_token
4. POST /auth/login                   { phone, password }            ← Get access_token
5. POST /auth/onboarding/profile      { fullName, age, gender, ... } ← Bearer: access_token
6. POST /auth/onboarding/vehicle      { vehicleType, plateNumber, ... } ← Bearer: access_token
7. GET  /auth/onboarding/status                                     ← Check progress
```

### New Passenger Registration

```
1. POST /auth/register/phone          { country_code, phone, role: "passenger" }
2. POST /auth/register/verify-otp     { phone, otp }
3. POST /auth/register/password       { password, confirmPassword }
4. POST /auth/login                   { phone, password }
```

### Password Recovery

```
1. POST /auth/forgot-password         { phone }
2. POST /auth/forgot-password/verify-otp  { phone, otp }
3. POST /auth/forgot-password/reset   { password, confirmPassword }  ← Bearer: reset_token
```

---

## Error Response Format

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description or array of validation errors",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `BAD_REQUEST` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `VALIDATION_ERROR` (422)

---

## Redis Key Reference

| Key                        | TTL      | Purpose                     |
| -------------------------- | -------- | --------------------------- |
| `otp:{phone}`              | 5 min    | Registration OTP            |
| `otp_attempts:{phone}`     | 5 min    | Registration OTP attempts   |
| `otp_reset:{phone}`        | 5 min    | Forgot password OTP         |
| `otp_reset_attempts:{phone}`| 5 min   | Forgot password OTP attempts|
| `reg_data:{phone}`         | 10 min   | Registration data (country, role) |
| `reg_token:{phone}`        | 10 min   | Registration token          |
| `reset_token:{phone}`      | 10 min   | Password reset token        |
| `refresh:{userId}:{jti}`   | 7 days   | Active refresh token        |
