# Testing Saved Jobs Feature in Postman

This guide will help you test the Saved Jobs feature using Postman.

## Prerequisites

1. **Base URL**: Your backend API URL (e.g., `http://localhost:8000` or your deployed URL)
2. **A candidate user account** (you'll need to login first)

## Step 1: Authenticate and Get Token

### Option A: Login as Candidate

**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/v1/auth/login`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "candidate@example.com",
    "password": "your_password"
  }
  ```

**Response:**
You'll receive a response with an `access_token`. Copy this token for the next steps.

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "candidate@example.com",
    ...
  }
}
```

### Option B: Signup as New Candidate

**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/v1/auth/signup`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "newcandidate@example.com",
    "password": "secure_password",
    "name": "John Doe",
    "picture": "https://example.com/picture.jpg"
  }
  ```

## Step 2: Set Up Authentication in Postman

Since the API uses cookies, you have two options:

### Option A: Use Cookies (Recommended for Postman)

1. After login, Postman will automatically store cookies from the response
2. For subsequent requests, Postman will send cookies automatically
3. Make sure cookies are enabled in Postman settings

### Option B: Use Authorization Header (If you modify the backend)

If you want to use Bearer token authentication, you can modify `get_current_user_id` to also check the Authorization header. For now, we'll use cookies.

**To manually set cookies in Postman:**
1. Go to the request
2. Click on "Cookies" link below the URL bar
3. Add a cookie:
   - **Name**: `auth_token`
   - **Value**: `{{access_token}}` (the token from login response)
   - **Domain**: Your API domain (e.g., `localhost`)

## Step 3: Get a Job ID to Save

First, let's get a list of available jobs:

**Request:**
- **Method**: `GET`
- **URL**: `{{base_url}}/api/v1/jobs/search?q=software&page=1&limit=10`
- **Headers**: (Cookies will be sent automatically)

**Response:**
```json
{
  "jobs": [
    {
      "job_id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Software Engineer",
      ...
    },
    ...
  ],
  "total": 10,
  ...
}
```

Copy a `job_id` from the response.

## Step 4: Save a Job

**Request:**
- **Method**: `POST`
- **URL**: `{{base_url}}/api/v1/candidate/jobs/{job_id}/save`
  - Replace `{job_id}` with an actual job ID from Step 3
  - Example: `/api/v1/candidate/jobs/123e4567-e89b-12d3-a456-426614174000/save`
- **Headers**: (Cookies will be sent automatically)

**Expected Response (First time - Saving):**
```json
{
  "status": "saved"
}
```

**Expected Response (Second time - Unsaving):**
```json
{
  "status": "unsaved"
}
```

**Error Responses:**
- `401 Unauthorized`: Not logged in or invalid token
- `404 Not Found`: Job not found or candidate profile not found
- `500 Internal Server Error`: Server error

## Step 5: Get All Saved Jobs

**Request:**
- **Method**: `GET`
- **URL**: `{{base_url}}/api/v1/candidate/saved-jobs?page=1&limit=10`
- **Query Parameters**:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 10): Items per page
- **Headers**: (Cookies will be sent automatically)

**Expected Response:**
```json
{
  "jobs": [
    {
      "job_id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Software Engineer",
      "job_summary": "...",
      "job_responsibilities": [...],
      "organization": {
        "name": "Company Name",
        "description": "...",
        "website": "..."
      },
      ...
    },
    ...
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "total_pages": 1,
  "has_next": false,
  "has_prev": false
}
```

**Empty Response (No saved jobs):**
```json
{
  "jobs": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "total_pages": 1,
  "has_next": false,
  "has_prev": false
}
```

## Step 6: Test Toggle Functionality

1. **Save a job** (POST to `/save`) → Should return `{"status": "saved"}`
2. **Save the same job again** (POST to `/save`) → Should return `{"status": "unsaved"}`
3. **Get saved jobs** (GET `/saved-jobs`) → Should not include the unsaved job
4. **Save it again** (POST to `/save`) → Should return `{"status": "saved"}`
5. **Get saved jobs** (GET `/saved-jobs`) → Should include the job again

## Postman Collection Setup Tips

### 1. Create Environment Variables

Create a Postman environment with:
- `base_url`: `http://localhost:8000` (or your backend URL)
- `access_token`: (will be set after login)

### 2. Create Pre-request Script for Auto Cookie Handling

In your login request, add this to **Tests** tab:
```javascript
// Extract token from response
const response = pm.response.json();
if (response.access_token) {
    pm.environment.set("access_token", response.access_token);
    
    // Set cookie manually
    pm.request.headers.add({
        key: 'Cookie',
        value: `auth_token=${response.access_token}`
    });
}
```

### 3. Create a Collection with These Requests

1. **Login** - POST `/api/v1/auth/login`
2. **Get Jobs** - GET `/api/v1/jobs/search`
3. **Save Job** - POST `/api/v1/candidate/jobs/{job_id}/save`
4. **Get Saved Jobs** - GET `/api/v1/candidate/saved-jobs`
5. **Unsave Job** - POST `/api/v1/candidate/jobs/{job_id}/save` (same endpoint, toggles)

## Troubleshooting

### Issue: 401 Unauthorized
- **Solution**: Make sure you're logged in and cookies are being sent
- Check that the `auth_token` cookie is present in the request

### Issue: 404 Not Found (Job)
- **Solution**: Verify the job_id exists by calling `/api/v1/jobs/{job_id}` first

### Issue: 404 Not Found (Profile)
- **Solution**: Make sure you're logged in as a candidate user (not an organization user)
- The user must have a candidate profile created

### Issue: Cookies Not Working
- **Solution**: 
  1. Check Postman settings → Enable "Send cookies automatically"
  2. Or manually add Cookie header: `Cookie: auth_token=YOUR_TOKEN_HERE`

## Example Complete Flow

```bash
# 1. Login
POST http://localhost:8000/api/v1/auth/login
Body: {"email": "test@example.com", "password": "password"}

# 2. Get available jobs
GET http://localhost:8000/api/v1/jobs/search?limit=5

# 3. Save a job (use job_id from step 2)
POST http://localhost:8000/api/v1/candidate/jobs/123e4567-e89b-12d3-a456-426614174000/save

# 4. Get saved jobs
GET http://localhost:8000/api/v1/candidate/saved-jobs

# 5. Unsave the job (same endpoint, toggles)
POST http://localhost:8000/api/v1/candidate/jobs/123e4567-e89b-12d3-a456-426614174000/save

# 6. Verify it's removed
GET http://localhost:8000/api/v1/candidate/saved-jobs
```

## Rate Limits

- Save/Unsave endpoint: **10 requests per minute**
- Get Saved Jobs endpoint: **10 requests per minute**

If you exceed the limit, you'll get a `429 Too Many Requests` response.
