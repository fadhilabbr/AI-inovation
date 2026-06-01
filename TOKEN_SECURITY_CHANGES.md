# Token Security Implementation - Changes Summary

## Overview
Implemented proper JWT token management with access tokens (short-lived) and refresh tokens (long-lived) for better security.

## Backend Changes

### 1. **Token Configuration** (`backend/app/auth.py`)
- ✅ Access token expiry: Changed from 7 days → **15 minutes**
- ✅ Added refresh token expiry: **7 days**
- ✅ Added `create_refresh_token()` function for generating refresh tokens
- ✅ Refresh token includes type marker (`"type": "refresh"`) to distinguish from access tokens

### 2. **Database Model** (`backend/app/models.py`)
- ✅ Added `refresh_token` column to `User` model
- ✅ Stores the current valid refresh token for token revocation support

### 3. **API Schemas** (`backend/app/schemas/user.py`)
- ✅ Updated `Token` schema to include `refresh_token` field
- ✅ Added `RefreshTokenRequest` schema for token refresh endpoint

### 4. **Authentication Routes** (`backend/app/routers/auth.py`)
- ✅ **Updated `/api/v1/auth/login`**
  - Now returns both `access_token` and `refresh_token`
  - Stores refresh token in database for validation
  - Both tokens include user claim in payload

- ✅ **Added `/api/v1/auth/refresh`** (NEW)
  - Endpoint: `POST /api/v1/auth/refresh`
  - Request body: `{ "refresh_token": "..." }`
  - Returns new access token + existing refresh token
  - Validates refresh token against stored value in database
  - Automatically rejects expired or tampered tokens

### 5. **Database Migration** (`backend/migrate_add_refresh_token.py`)
- Run after pulling changes: `python migrate_add_refresh_token.py`
- Adds `refresh_token` column to existing users table

## Frontend Changes

### 1. **API Client Service** (`frontend/app/lib/api-client.ts`)
- ✅ Created `ApiClient` class with auto-refresh mechanism
- ✅ Intercepts 401 responses and automatically refreshes access token
- ✅ Retries failed requests with new access token
- ✅ Clears tokens and redirects to login if refresh fails
- ✅ Stores both access and refresh tokens in localStorage

### 2. **Auth Context** (`frontend/app/components/AuthContext.tsx`)
- ✅ Updated `login()` function to accept refresh token
- ✅ Stores refresh token in localStorage alongside access token
- ✅ Clears both tokens on logout

### 3. **Login Page** (`frontend/app/login/page.tsx`)
- ✅ Updated to pass `refresh_token` to auth context

## How It Works

### User Flow
1. **Login**: User submits credentials → Backend generates both tokens → Frontend stores both
2. **Request**: Frontend makes API call with access token in `Authorization` header
3. **Token Expired**: Backend returns 401 → Frontend automatically calls `/refresh` endpoint
4. **Refresh**: Frontend sends refresh token → Backend validates & returns new access token
5. **Retry**: Frontend retries original request with new token
6. **Logout**: Both tokens are cleared from storage

## Benefits
| Benefit | Details |
|---------|---------|
| **Security** | Access tokens expire quickly (15 min) - less damage if compromised |
| **UX** | Seamless token refresh - users won't be randomly logged out |
| **Revocation** | Storing refresh token in DB allows token revocation/blacklisting |
| **Flexibility** | Refresh tokens can be kept longer (7 days) than access tokens |

## Testing

### Backend
```bash
cd backend
# Run migration
python migrate_add_refresh_token.py

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"password"}'

# Test refresh (use refresh_token from login response)
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<your_refresh_token>"}'
```

### Frontend
- Log in and check localStorage:
  - `smartbin_token` - access token
  - `smartbin_refresh_token` - refresh token
  - `smartbin_user` - user data
- Network tab will show automatic `/refresh` calls when access token expires

## Future Improvements
1. Add refresh token rotation (new refresh token on each refresh)
2. Add token blacklist/revocation endpoint
3. Move tokens to httpOnly cookies (for better security)
4. Add logout endpoint that revokes tokens on backend
5. Implement refresh token expiry check on frontend
