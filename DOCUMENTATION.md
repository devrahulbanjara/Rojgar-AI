# ConvexHire

ConvexHire is an AI-assisted recruitment platform that connects companies with candidates through an end-to-end hiring pipeline - from job creation to final offer. The platform has two distinct sides: a **recruiter experience** for companies managing their hiring, and a **candidate experience** for job seekers managing their applications.

---

## Table of Contents

1. Who Uses ConvexHire
2. Getting Started — Signup & Onboarding
3. The Candidate Experience
   - Profile & Open to Work
   - Resume Builder
   - Finding Jobs
   - The Apply Flow & Resume Gap Analysis
   - Tracking Applications
4. The Recruiter Experience
   - Dashboard
   - Creating Jobs
   - Applications Page
   - Candidates Page
   - Evaluation
   - Shortlisting
   - Outreach & Emails
   - Interviews
   - Final Decision
   - Recruiter AI Chat
5. Company & Team Management
6. Access Levels by Role
7. The Full Hiring Pipeline
8. Key Product Principles

---

## 1. Who Uses ConvexHire

There are three types of users on the platform:

**Candidates** — job seekers who build a profile, create resumes, browse jobs, apply, and track their application pipeline from submission to offer.

**Recruiters** — hiring team members who create jobs, review applicants, run AI evaluation, manage interviews, and send outreach emails. They belong to a company and must be approved by an admin before gaining access.

**Recruiter Admins** — company founders or leads who have all recruiter capabilities plus the ability to register the company, invite and approve team members, and manage company settings.

---

## 2. Getting Started — Signup & Onboarding

### Signing Up

Anyone can create an account with an email and password, or sign in with Google. During signup, the user picks their role — candidate, recruiter, or recruiter admin. Email accounts require verifying a 6-digit code sent to their inbox before the account is activated. Google accounts skip this step and are verified instantly. Forgot password works via a secure one-time reset link sent to email.

### Candidate Onboarding

After signup, candidates go through a short onboarding flow: they specify what job roles they are looking for — these become their **target roles** and shape how the platform surfaces relevant jobs. From there they build out their full profile (covered below).

### Recruiter Onboarding

Recruiters must join a company before they can access anything. They search for their company on the platform and submit a join request. Their account sits in a **pending** state — they cannot create jobs, view applications, or use any recruiter features until the admin approves the request.

### Recruiter Admin Onboarding

Admins register their company immediately after signup, providing a name, website, and industry. They are approved instantly with no waiting period and gain full access right away.

---

## 3. The Candidate Experience

### Profile & Open to Work

Candidates maintain a persistent profile that represents them across all applications. The profile includes:

- Full name, location, phone number
- Professional headline and summary
- Work experience (company, role, dates, description)
- Education (institution, degree, dates)
- Skills list
- Years of experience
- LinkedIn, GitHub, and portfolio links
- Avatar photo

A **profile completion indicator** shows candidates how complete their profile is, nudging them to fill in any missing sections. A more complete profile gives the AI more to work with when scoring applications.

The **Open to Work** toggle marks the candidate as actively seeking opportunities. It can be turned on or off at any time.

**AI Resume Import** — instead of filling in the profile manually, candidates can upload any existing PDF resume. The AI reads it and automatically extracts and pre-fills all profile fields. The candidate reviews everything before confirming — nothing is saved without their explicit approval. This also creates a resume object that can immediately be used to apply to jobs.

### Resume Builder

Candidates can create and manage multiple resumes directly on the platform. Resumes are distinct from the profile — they are formatted documents that get attached to specific job applications, allowing candidates to tailor each application to the role.

Each resume is fully editable with a live preview. Candidates can:

- Name each resume to keep versions organised (e.g. "Backend focused", "Full Stack general")
- Edit all sections: summary, work experience, education, skills, and links
- Preview the formatted output as it will appear to a recruiter
- Download the resume as a PDF at any time
- Delete resumes they no longer need

Having multiple resumes lets candidates put their best, most relevant foot forward for each specific job.

### Finding Jobs

The **Jobs page** shows all active job listings across the platform. Candidates can search by keyword and filter by location type (remote, onsite, or hybrid) and salary range. The search understands natural language — typing "Python backend" surfaces roles that are semantically related, even if those exact words don't appear in the job title.

Each job can be previewed in a side panel without leaving the list, showing the full details: title, company, location, salary range, work type, responsibilities, requirements, preferred qualifications, and expiry date.

### The Apply Flow & Resume Gap Analysis

Clicking Apply opens a structured multi-step application flow:

**Step 1 — Select a resume.** The candidate picks which of their saved resumes to attach to this application. If they have no resumes yet, they are prompted to create or import one first.

**Step 2 — Resume Gap Analysis (optional but valuable).** Before submitting, the candidate can run an AI analysis that compares their selected resume against the specific job's requirements. The AI identifies:

- What skills and experience in their resume match the job well
- What gaps exist between their resume and what the job is asking for
- Specific suggestions for what to add or improve

**Step 3 — Choose what to do with the gaps.** After seeing the results, the candidate decides:

- **Apply as-is** — submit with the current resume without making any changes
- **Patch the resume** — let the AI suggest specific additions or edits to address the identified gaps. The candidate reviews every suggested change before anything is updated. Nothing is changed without their approval.

**Step 4 — Share profile.** The candidate confirms they are happy for their profile and selected resume to be shared with the company.

**Step 5 — Submit.** The application is created. If the job has auto-evaluation enabled, AI scoring begins in the background immediately.

A candidate cannot apply to the same job twice, and expired jobs no longer accept new applications.

### Tracking Applications

The candidate **Dashboard** shows a live summary — total applications, how many are shortlisted, how many have interviews scheduled, offers received, and rejections. It gives an instant read on where things stand across all active applications.

The **Applications page** shows each application in detail:

- Job title, company, and the date applied
- A visual progress bar showing where they are in the pipeline
- Current status label
- A side detail panel showing: the full application timeline, the AI score out of 100 and written feedback (both become visible after the evaluation phase), and the latest status update message

Status updates are visible in real time. After evaluation, candidates can see their score and the written AI feedback explaining what matched well and what was missing — so even rejected candidates understand the reasoning behind the decision.

The full pipeline a candidate moves through:

1. **Applied** — submitted successfully, under consideration
2. **Shortlisted** — selected to move forward to interview
3. **Interview Booked** — an interview slot has been confirmed
4. **Interview Completed** — the interview has taken place
5. **Offer** — a job offer has been extended
6. **Rejected** — the application was unsuccessful (can happen after evaluation or after interview)

---

## 4. The Recruiter Experience

### Dashboard

The recruiter dashboard is the daily action centre. It surfaces at a glance: pending applications needing attention, upcoming interviews, outreach email drafts waiting for approval, and (for admins) pending team join requests. Everything requiring action is visible in one place so nothing falls through the cracks.

### Creating Jobs

Recruiters have two ways to create a job:

**Manual creation** — the recruiter fills out a structured form: title, overview, responsibilities (as a list), requirements (as a list), preferred qualifications, benefits, location, location type (remote/onsite/hybrid), salary range and currency, and an expiry date. The job can be saved as a **draft** (invisible to candidates) or published as **active** immediately.

**AI Job Assistant** — the recruiter types a brief description of what they need, e.g. "Senior Python backend engineer in Kathmandu, fintech startup, 3+ years, FastAPI." The AI researches the role, benchmarks salary for the location and seniority level, and generates a complete structured job draft with all fields filled in. The recruiter can:

- Approve the draft as-is and commit it into a real job
- Request refinements in plain language ("make the tone less formal", "add Docker to requirements", "remove the benefits section")
- Reject the draft entirely and start over

The AI refines based on feedback and presents the draft again. This loop continues until the recruiter is satisfied. Specific fields like salary or title can be **locked** before generation so the AI cannot override them regardless of what it produces. Once committed, the job can still be edited manually before publishing.

Jobs have three states: **draft** (not visible to candidates), **active** (live and accepting applications), and **expired** (automatically set when the expiry date passes — stops accepting applications, unlocks shortlisting).

### Applications Page

The Applications page gives a cross-job view of every application the company has received. Recruiters can filter by job and by application status. This is useful for getting a high-level read on pipeline volume and where candidates sit across all open roles without needing to go into each job individually.

### Candidates Page

The Candidates page shows one row per person, not per application. If a candidate has applied to multiple company jobs, they appear once with all their applications listed beneath them — avoiding the confusion of seeing the same person appear multiple times.

Clicking into a candidate shows each of their applications. For each one, the recruiter can see the job, when they applied, their score, the current status with a dropdown to update it directly, and a link to view their full submitted resume on the platform.

### Evaluation

The Evaluation page focuses on one job at a time. The recruiter selects a job and sees all candidates ranked by their AI score, with their written feedback and current status.

**How AI evaluation works:** When triggered, the AI reads the candidate's attached resume and compares it against the job's requirements and preferred qualifications. It produces a score from 0 to 100 and writes a plain-English paragraph explaining what aligned well, what was missing, and any concerns. Each candidate is scored independently.

Evaluation can run in two ways:

- **Automatically per application** — if auto-evaluation is enabled on the job, each new application is scored as soon as it comes in, with no manual action needed.
- **Manually in batch** — the recruiter clicks "Run AI evaluation" to score all currently unscored applications at once.

Recruiters can also **manually edit** any candidate's score or feedback — useful when the recruiter has additional context the AI does not.

Candidates can be filtered by score range (above threshold, 50–69, below 50), by review status (reviewed, pending, missing review), and searched by name or email.

A **shortlist threshold** (0–100) is configured per job. This score cutoff is used during the finalize step.

Shortlisting is only available after the job has **expired** — ensuring the full application window closes before any decisions are made.

### Shortlisting

After reviewing screened applications, the recruiter decides who moves forward. Two approaches:

**Manual shortlisting** — the recruiter reviews each candidate individually and updates their status to shortlisted or rejected one at a time. Full control over every single decision.

**AI-assisted finalize** — the recruiter clicks "Finalize". Candidates at or above the threshold score are automatically shortlisted; everyone below is rejected. The threshold can be adjusted before running. The entire cohort is processed in one action.

Once a candidate is shortlisted, an outreach email draft is created inviting them to book an interview. Once rejected, a draft rejection email is created including their personalized AI feedback. Neither email is sent until the recruiter reviews and approves it.

### Outreach & Emails

No email ever reaches a candidate automatically. Every draft must be reviewed and approved by a recruiter first — this is a deliberate product decision to keep humans in control of all candidate communication.

The Outreach page shows the email pipeline for a selected job as a set of stages:

- **Generate Drafts** — shows how many candidates are ready and waiting for drafts to be created
- **Review & Edit** — drafts generated and waiting for recruiter review
- **Approve** — drafts the recruiter has approved, queued to send
- **Send** — emails already dispatched

For each draft, the recruiter can read the full email body and subject, edit either directly in-line, then approve. Drafts can also be **discarded** to suppress sending without deleting the candidate's record. "Send all" approves and dispatches all pending drafts at once.

The two email types:

**Shortlist email** — warm and encouraging. Tells the candidate they have been selected and includes a link to book an interview slot via Cal.com. Candidates are told to book using the same name and email they registered with on ConvexHire — this is how the platform automatically matches the booking back to their specific application.

**Rejection email** — respectful and kind. Includes the AI-generated evaluation feedback so the candidate understands the specific reasons they were not selected, rather than receiving a generic rejection.

### Interviews

Interview scheduling is handled through Cal.com integration. When the shortlist email lands, the candidate clicks the booking link, picks a time slot, and confirms. ConvexHire detects the booking automatically via a webhook — the application status updates to "Interview Booked" instantly, with no manual recruiter action required.

The **Interviews page** shows all upcoming and past interviews for the company. Recruiters can filter by job and by date range (today, this week, this month, custom range). Each row shows the candidate's name, the role they applied for, the scheduled date and time, and the meeting location or link.

After the interview takes place, the recruiter marks it as complete on this page. This unlocks the final decision step.

### Final Decision

Once an interview is marked complete, the recruiter sets the final outcome on the application: **offer** or **rejected**. The candidate sees the status update on their dashboard immediately. No automated email is triggered here — any post-interview communication goes through the outreach system if needed.

### Recruiter AI Chat

The Chat is a persistent AI assistant built exclusively for recruiters. It is not a generic chatbot — it has real tools connected to live platform data. Conversations are saved and context is preserved across sessions, so the AI remembers what was discussed in previous conversations.

**What the chat AI can do:**

**Search past candidates** — ask in natural language: "Find me strong Python developers who applied in the last three months with senior-level experience." The AI searches across all company applications using semantic understanding of skills, experience descriptions, and feedback — not just keyword matching.

**Research salary ranges** — ask: "What is a competitive salary for a senior data engineer in Kathmandu right now?" The AI searches current market data and synthesises a relevant, contextualised answer.

**List and browse jobs** — ask: "What roles do we have open?" or "Tell me about the ML role." The AI understands informal and imprecise references to jobs — "that backend opening", "the fintech role we posted last month" — and retrieves the right one without needing exact titles.

**Look up a specific candidate** — ask: "Tell me about Aashish Basnet's application for the backend role." The AI returns their resume summary, AI score, written feedback, current status, and any other relevant detail.

**Edit a job** — ask: "Change the salary for the backend role to 80–100k." The AI identifies which job is meant, asks for confirmation if there's any ambiguity, then prepares a side-by-side before/after preview of exactly what will change. It pauses and waits for the recruiter to confirm. The change is never saved silently.

**Chat session management** — the left sidebar shows all previous conversations with timestamps. The recruiter can switch between sessions to restore full conversation history, or start a fresh chat at any time.

---

## 5. Company & Team Management

### Company Profile

The recruiter admin manages the company's public profile — name, website, industry, and logo. These details are displayed on all job listings that candidates see when browsing.

### Company Settings

Admins have access to a Company Settings page where all company information can be updated and the company logo can be uploaded or replaced. Old logo files are cleaned up automatically when a new one is uploaded.

### Managing the Recruiting Team

The **Recruiters page** shows all current active team members with their name, email, role, status, and join date.

Admins can:

- **Approve** pending join requests — granting the recruiter full access
- **Reject** join requests — denying access
- **Remove** an active recruiter at any time — immediately revoking their access to all company data

Pending join requests also surface as an action item on the admin's dashboard so they are never overlooked.

Membership has two roles — **recruiter** (standard hiring access) and **admin** (full access including team and company management) — and three states: **pending**, **active**, and **rejected**.

---

## 6. Access Levels by Role

| Feature                                     | Candidate | Recruiter | Admin |
| ------------------------------------------- | --------- | --------- | ----- |
| Browse & apply to jobs                      | ✓         | —         | —     |
| Resume gap analysis on apply                | ✓         | —         | —     |
| Track application pipeline in real time     | ✓         | —         | —     |
| See AI score & feedback on own applications | ✓         | —         | —     |
| Build & manage multiple resumes             | ✓         | —         | —     |
| Download resume as PDF                      | ✓         | —         | —     |
| AI resume import to profile                 | ✓         | —         | —     |
| Open to Work toggle                         | ✓         | —         | —     |
| Create & publish jobs (manual)              | —         | ✓         | ✓     |
| AI job draft assistant                      | —         | ✓         | ✓     |
| View applications page (all jobs)           | —         | ✓         | ✓     |
| View candidates page (all people)           | —         | ✓         | ✓     |
| View candidate resumes on platform          | —         | ✓         | ✓     |
| Run AI evaluation                           | —         | ✓         | ✓     |
| Edit candidate scores & feedback manually   | —         | ✓         | ✓     |
| Shortlist / reject candidates               | —         | ✓         | ✓     |
| Generate, review & approve outreach emails  | —         | ✓         | ✓     |
| View & filter interviews                    | —         | ✓         | ✓     |
| Mark interviews complete                    | —         | ✓         | ✓     |
| Give offer / final reject post-interview    | —         | ✓         | ✓     |
| Recruiter AI chat (all capabilities)        | —         | ✓         | ✓     |
| Register company                            | —         | —         | ✓     |
| Approve / reject recruiter join requests    | —         | —         | ✓     |
| Remove team members                         | —         | —         | ✓     |
| Update company profile, logo & settings     | —         | —         | ✓     |

---

## 7. The Full Hiring Pipeline at a Glance

```
Candidate browses jobs
         ↓
   Selects a resume
         ↓
   Runs Resume Gap Analysis (optional)
   AI identifies gaps → candidate patches resume or applies as-is
         ↓
   Candidate applies, attaches resume
         ↓
       Applied
         ↓
   AI Evaluation ←── auto on apply OR manually triggered by recruiter
         ↓
   Recruiter reviews AI scores & written feedback on Evaluation page
         ↓
   Shortlisted ──────────────────────────── Rejected (post-evaluation)
         ↓                                           ↓
   Outreach: shortlist email drafted        Outreach: rejection email with AI feedback
         ↓                                           ↓
   Recruiter reviews & approves email       Recruiter reviews & approves email
         ↓                                           ↓
   Email sent to candidate                  Email sent to candidate → pipeline closed
         ↓
   Candidate books interview via Cal.com link in email
         ↓
   Interview Booked (auto-detected via Cal.com webhook)
         ↓
   Interview takes place
         ↓
   Recruiter marks interview complete
         ↓
   Interview Completed
         ↓
   Offer ────────────────────────────────── Rejected (post-interview)
```

---

## 8. Key Product Principles

**AI assists, humans decide.** The AI scores applications, drafts emails, generates job descriptions, analyses resume gaps, and suggests edits — but every shortlisting decision, every email sent, and every data change is explicitly confirmed by a human before it takes effect.

**Candidates always know where they stand.** Status updates are visible in real time on the candidate dashboard. Rejection emails always include the AI feedback so candidates understand the specific reasons — not a generic response.

**The pipeline only opens after expiry.** Shortlisting is only available once a job has expired. This ensures every applicant gets a fair window before any decisions are made.

**No email ever sends automatically.** Every outreach email — shortlist or rejection — sits in a review queue until a recruiter reads it, optionally edits it, and approves it. The AI writes, the human sends.

**One application per job.** A candidate cannot apply to the same job more than once.

**One interview booking per application.** A candidate cannot book the same job interview twice. Duplicate booking attempts are silently ignored.

**Job edits always show a preview.** When changes are made to a job via the AI chat, the system always shows a before/after diff and waits for explicit confirmation. Changes are never saved silently.
