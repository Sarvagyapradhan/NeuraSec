# NeuraSec Authentication Guide

## Overview

NeuraSec uses a dual-authentication system:

1. **Frontend JWT Authentication**: Authenticates users directly against the database.
2. **Backend FastAPI Authentication**: Provides additional security for API endpoints.

## Quick Setup

Run the authentication setup script:

```bash
node setup-auth.js
```

This will:
- Check and configure environment variables
- Ensure database connection is working
- Create a test user if needed
- Verify backend API is running

After setup, you can login with:
- **Email**: test@example.com
- **Password**: password123

## Manual Setup

If you prefer manual setup, follow these steps:

### 1. Environment Variables

Ensure `.env.local` has the following variables:

```
# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# JWT Configuration
JWT_SECRET=CHANGEME_super_secret_key_for_jwt_token_generation

# Database Connection
POSTGRES_HOST=aws-0-ap-south-1.pooler.supabase.com
POSTGRES_PORT=6543
POSTGRES_DATABASE=postgres
POSTGRES_USER=postgres.laapgnufkuqnmiympscm
POSTGRES_PASSWORD=your_password
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}
```

Also ensure the backend has matching configuration in `backend/.env`:

```
# Security settings
SECRET_KEY=CHANGEME_super_secret_key_for_jwt_token_generation
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 2. Create Test User

Run the script to create a test user:

```bash
node create-test-user-direct.js
```

### 3. Start Services

Start the backend API:

```bash
cd backend
python run.py
```

Start the Next.js frontend:

```bash
npm run dev
```

## Authentication Flow

1. User submits credentials (username/email + password)
2. Frontend tries to authenticate locally first
3. If local auth fails, it tries backend authentication
4. Upon successful authentication, a JWT token is issued
5. Token is stored in an HTTP-only cookie and localStorage
6. Protected routes check for valid token via middleware

## Troubleshooting

### Login Issues

1. **"Invalid credentials" error**:
   - Ensure you're using the correct username/password
   - Run `node create-test-user-direct.js` to reset the test user

2. **Backend connection issues**:
   - Ensure backend is running at `http://localhost:8000`
   - Check backend logs for errors

3. **Database connection issues**:
   - Run `node check-db-connection.js` to test database connection
   - Verify database credentials in `.env.local`

### Redirection Issues

If login succeeds but you're not redirected to the dashboard:

1. **Clear browser cache/cookies**:
   - Try clearing your browser cookies and cache
   - Or use incognito/private browsing mode

2. **Check console for errors**:
   - Open developer tools (F12) to check for any errors

3. **Manual redirect**:
   - Try manually navigating to `/dashboard` after logging in
   - If this works, it indicates a client-side redirection issue

4. **Run the auth flow test**:
   ```bash
   node test-auth-flow.js
   ```

### Protected Routes

If you can't access protected routes after login:

1. Check browser cookies to ensure `auth_token` is set
2. Verify JWT_SECRET matches between frontend and backend
3. Clear browser cookies and try logging in again

## Testing Authentication

Run the login test script:

```bash
node test-login.js
```

For a more comprehensive test of the authentication flow:

```bash
node test-auth-flow.js
```

These tests verify all authentication endpoints are working correctly. 