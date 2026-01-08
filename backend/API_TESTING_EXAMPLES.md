# API Testing Examples

Quick reference for testing the new organization architecture endpoints.

## 1. Organization Signup

```bash
POST /api/v1/auth/organization/signup
Content-Type: application/json

{
  "email": "hr@techcorp.com",
  "password": "securepass123",
  "name": "TechCorp Inc",
  "location_city": "San Francisco",
  "location_country": "USA",
  "website": "https://techcorp.com",
  "description": "Leading tech company",
  "industry": "Technology",
  "founded_year": 2020
}
```

**Response**: Sets cookie `auth_token` with organization token
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "organization": {
    "id": "org_123",
    "email": "hr@techcorp.com",
    "name": "TechCorp Inc",
    "location_city": "San Francisco",
    "location_country": "USA",
    "website": "https://techcorp.com",
    "description": "Leading tech company",
    "industry": "Technology",
    "founded_year": 2020,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
}
```

## 2. Organization Login

```bash
POST /api/v1/auth/organization/login
Content-Type: application/json

{
  "email": "hr@techcorp.com",
  "password": "securepass123",
  "remember_me": true
}
```

**Response**: Same as signup response

## 3. Get Organization Profile

```bash
GET /api/v1/organization/me
Cookie: auth_token=<organization_token>
```

**Response**:
```json
{
  "id": "org_123",
  "email": "hr@techcorp.com",
  "name": "TechCorp Inc",
  "location_city": "San Francisco",
  "location_country": "USA",
  "website": "https://techcorp.com",
  "description": "Leading tech company",
  "industry": "Technology",
  "founded_year": 2020,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

## 4. Update Organization Profile

```bash
PUT /api/v1/organization/me
Cookie: auth_token=<organization_token>
Content-Type: application/json

{
  "description": "Updated description",
  "website": "https://newtechcorp.com"
}
```

## 5. Create Recruiter

```bash
POST /api/v1/organization/recruiters
Cookie: auth_token=<organization_token>
Content-Type: application/json

{
  "email": "recruiter@techcorp.com",
  "name": "John Recruiter"
}
```

**Response**:
```json
{
  "id": "user_456",
  "email": "recruiter@techcorp.com",
  "name": "John Recruiter",
  "organization_id": "org_123",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

## 6. List Organization Recruiters

```bash
GET /api/v1/organization/recruiters
Cookie: auth_token=<organization_token>
```

**Response**:
```json
[
  {
    "id": "user_456",
    "email": "recruiter@techcorp.com",
    "name": "John Recruiter",
    "organization_id": "org_123",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

## 7. Get Single Recruiter

```bash
GET /api/v1/organization/recruiters/user_456
Cookie: auth_token=<organization_token>
```

**Response**:
```json
{
  "id": "user_456",
  "email": "recruiter@techcorp.com",
  "name": "John Recruiter",
  "organization_id": "org_123",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

## 8. Update Recruiter

```bash
PUT /api/v1/organization/recruiters/user_456
Cookie: auth_token=<organization_token>
Content-Type: application/json

{
  "name": "John Senior Recruiter",
  "email": "john.senior@techcorp.com"
}
```

**Response**:
```json
{
  "id": "user_456",
  "email": "john.senior@techcorp.com",
  "name": "John Senior Recruiter",
  "organization_id": "org_123",
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T12:30:00"
}
```

**Note**: Both fields are optional, you can update just name or just email:
```json
{
  "name": "Updated Name Only"
}
```

## 9. Delete Recruiter

```bash
DELETE /api/v1/organization/recruiters/user_456
Cookie: auth_token=<organization_token>
```

**Response**:
```json
{
  "message": "Recruiter removed successfully"
}
```

## 10. Candidate Signup (No Role Required)

```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "candidate@email.com",
  "password": "password123",
  "name": "Jane Candidate"
}
```

**Response**: Sets cookie with user token, creates candidate profile automatically

## 11. User Login (Candidates & Recruiters)

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "recruiter@techcorp.com",
  "password": "password123",
  "remember_me": false
}
```

## 12. Create Job (As Recruiter)

```bash
POST /api/v1/jobs
Cookie: auth_token=<recruiter_user_token>
Content-Type: application/json

{
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "level": "Senior",
  "description": "We are looking for a senior software engineer...",
  "requiredSkillsAndExperience": ["Python", "FastAPI", "PostgreSQL"],
  "niceToHave": ["Docker", "AWS"],
  "benefits": ["Health insurance", "Remote work"],
  "locationCity": "San Francisco",
  "locationCountry": "USA",
  "locationType": "Hybrid",
  "employmentType": "Full-time",
  "salaryMin": 120000,
  "salaryMax": 180000,
  "currency": "USD",
  "applicationDeadline": "2024-12-31",
  "status": "active"
}
```

**Response**: Job with `organization_id` from recruiter's organization and `created_by_user_id` set

## 13. Get Jobs (Filter by Organization)

```bash
GET /api/v1/jobs?organization_id=org_123&page=1&limit=10
```

**Response**:
```json
{
  "jobs": [
    {
      "job_id": "job_789",
      "id": "job_789",
      "organization_id": "org_123",
      "title": "Senior Software Engineer",
      "organization": {
        "id": "org_123",
        "name": "TechCorp Inc",
        "description": "Leading tech company",
        "location": "San Francisco, USA",
        "website": "https://techcorp.com",
        "industry": "Technology",
        "founded_year": 2020
      },
      "company_name": "TechCorp Inc",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "total_pages": 1,
  "has_next": false,
  "has_prev": false
}
```

## 14. Get Recruiter's Jobs

```bash
GET /api/v1/jobs?user_id=user_456&page=1&limit=10
Cookie: auth_token=<recruiter_user_token>
```

Returns all jobs from the recruiter's organization

## 15. Recruiter CRUD Summary

**Complete recruiter management flow:**

1. **List all recruiters**: `GET /organization/recruiters`
2. **Create recruiter**: `POST /organization/recruiters` 
3. **Get single recruiter**: `GET /organization/recruiters/{id}`
4. **Update recruiter**: `PUT /organization/recruiters/{id}`
5. **Delete recruiter**: `DELETE /organization/recruiters/{id}`

All endpoints require organization authentication (organization token in cookie).

---

## Error Cases

### Recruiter Tries to Signup Publicly
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "recruiter@email.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response**: 400 Bad Request
```json
{
  "detail": "Recruiters cannot sign up publicly. Must be created by an organization."
}
```

### Email Already Exists
```bash
POST /api/v1/auth/organization/signup
Content-Type: application/json

{
  "email": "hr@techcorp.com",  // Already exists
  "password": "pass",
  "name": "Another Org"
}
```

**Response**: 400 Bad Request
```json
{
  "detail": "Email already registered"
}
```

### Update Recruiter with Duplicate Email
```bash
PUT /api/v1/organization/recruiters/user_456
Cookie: auth_token=<organization_token>
Content-Type: application/json

{
  "email": "existing@email.com"  // Already taken by another user
}
```

**Response**: 400 Bad Request
```json
{
  "detail": "Email already in use"
}
```

### Get Recruiter from Different Organization
```bash
GET /api/v1/organization/recruiters/user_999
Cookie: auth_token=<org_123_token>  // But user_999 belongs to org_456
```

**Response**: 403 Forbidden
```json
{
  "detail": "Recruiter does not belong to this organization"
}
```

### Recruiter Edits Job from Different Organization
```bash
PUT /api/v1/jobs/job_999
Cookie: auth_token=<recruiter_from_org_123>
Content-Type: application/json

{
  "title": "Updated Title"
}
```

**Response**: 403 Forbidden
```json
{
  "detail": "You can only edit jobs from your organization"
}
```

### User Token Used on Organization Endpoint
```bash
GET /api/v1/organization/me
Cookie: auth_token=<user_token>  // Should be organization token
```

**Response**: 403 Forbidden
```json
{
  "detail": "Organization authentication required"
}
```

## Testing Flow

1. **Organization Setup**
   - Sign up organization
   - Update organization profile
   - Create 2-3 recruiters

2. **Recruiter Login**
   - Log in as recruiter (use recruiter email/password from user creation)
   - Create multiple jobs
   - Verify jobs have organization_id

3. **Candidate Flow**
   - Sign up as candidate
   - Search for jobs
   - View job with organization details
   - Apply to job

4. **Recruiter CRUD Tests**
   - Create recruiter
   - Get single recruiter by ID
   - Update recruiter name
   - Update recruiter email
   - Try to update with duplicate email (should fail)
   - List all recruiters
   - Delete recruiter

5. **Authorization Tests**
   - Try to create recruiter with user token (should fail)
   - Try to get/update recruiter from different org (should fail)
   - Try to edit job from different organization (should fail)
   - Try organization endpoint with user token (should fail)

6. **Cleanup**
   - Delete recruiter
   - Verify jobs still exist
   - Verify organization can still manage remaining recruiters

## Notes

- Organization tokens have `entity_type: "organization"` in JWT
- User tokens have `entity_type: "user"` in JWT
- Recruiters have `organization_id` NOT NULL
- Candidates have `organization_id` NULL
- Jobs have both `organization_id` and `created_by_user_id`
- Email uniqueness enforced across users AND organizations