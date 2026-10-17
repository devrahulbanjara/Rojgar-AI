# Recruiter flow, data model and screens

The spec the recruiter app is built from. If a screen or field is not here, it does not ship.

## 0. Who is who (hierarchy and roles)

Words in the product: **Business**, **Team**, **Job**, **Applicant**. We never say "candidate" or "recruiter".

```
Rojgar AI (platform)
  └─ Platform staff (is_platform_admin)       approve businesses, handle reports, plans, support
Person (one account: phone and/or email; no global role)
  ├─ can be a member of Businesses            role per business: Owner · Manager · Interviewer
  └─ can be an Applicant to Jobs              sees only their own applications
Business (status: pending → active · suspended · rejected)
  ├─ Members (Owner 1+, Manager, Interviewer), joined only by invite link
  ├─ Branches (optional, for multi-branch businesses)
  └─ Jobs → Applications → Applicant (Person), Referrers, Interviews, Events
```

| Role | Can |
|---|---|
| Owner | Everything in the business: plan and billing, members, all jobs |
| Manager | Post and edit jobs, decide on applicants, invite to interview |
| Interviewer | See applicants of jobs they're added to, add interview notes ("How did it go?") |
| Applicant | Apply (no account needed), see status, withdraw, delete their data |
| Platform staff | Approve or reject businesses, suspend, review reports and flagged jobs, adjust plans, read-only support view |

### How a business starts
A business doesn't "sign up". A **person** signs up (email and password, or Google), then **creates a business** (name, type, district, phone, optional PAN/registration number and a photo of the certificate). The business is **pending**: the owner can set everything up and draft jobs, but **jobs can't go public until platform staff approve the business** (usually the same day; staff check PAN on the IRD site or call the owner). Approved businesses get a "Verified" badge on their job pages.

People join an existing business **only through an invite link** from an Owner. There is no "request to join" by typing a business name.

### Platform admin panel (/admin)
- **Approvals**: queue of pending businesses with details and documents; Approve, Ask for more info (sends an email), Reject (with reason).
- **Businesses**: search, status, plan and usage, members, suspend/restore.
- **Reports and flags**: applicants' "Report this job", jobs flagged automatically (fee requests, phone numbers asking for money, discriminatory must-haves); Unpublish / Restore / Suspend business.
- **Payments**: passes and subscriptions; mark a bank-transfer payment as received until eSewa/Khalti is live.
- Every admin action is written to the audit log.

## 1. What a recruiter is trying to do

| Job to be done | How often | Today | Target |
|---|---|---|---|
| Post a job and get it in front of people | Weekly | Long form, then hunt for a link | 2 minutes, link ready to paste |
| Decide on new applicants | Daily, the main work | Drawer over the list, 3 ways to set a status, CV behind a tab | One key per candidate, evidence on screen |
| Know who is interviewing and what is stuck | Daily | Spread over several pages | One screen: Today |
| Tell candidates what happened | After every decision | Separate outreach tab, manual | Happens as part of the decision |
| Close the job when hired | Monthly | Several status changes | One action that also tells everyone else |

## 2. The flow

```
Post job ─► Share link ─► Applications arrive ─► Each is reviewed within a minute
                                                          │
                     ┌────────────────────────────────────┘
                     ▼
              Decide (S / R)
              ├─ Shortlist ─► invite email with booking link ─► Interview ─► Scorecard ─► Offer ─► Hired ─► Close job
              └─ Reject    ─► kind email (sent after 10 s undo window)
```

Rules that keep it simple:
- Reviews are rolling: a candidate is reviewed when they apply, not when the job closes. Nobody waits for an expiry date.
- The AI recommends; only a person moves a candidate forward or out.
- Every decision sends the right email automatically, with a preview and undo. No separate "outreach" step.
- A candidate is always in exactly one stage.

## 3. Data model

Seven tables carry the product. Everything a screen shows comes from these.

```
Company 1─* Member (role: admin | recruiter)
Company 1─* Job 1─* Application *─1 Person
                     Application 1─1 Review          (AI, per application)
                     Application 1─* Event           (timeline: stage changes, emails, notes)
                     Application 1─* Interview 1─* Scorecard
```

### Job
| Field | Type | Notes |
|---|---|---|
| title, location, work_type (onsite/hybrid/remote), employment_type (full_time/part_time/contract/internship) | text/enum | |
| salary_min, salary_max, currency, show_salary | int/text/bool | currency defaults to NPR |
| description | rich text | One field. Replaces overview + responsibilities + requirements + preferred + benefits arrays |
| must_haves | text[] (≤ 6) | Short criteria the review checks, e.g. "3+ years Python in production". Confirmed by the recruiter at posting |
| nice_to_haves | text[] (≤ 6) | Same, weighted lower |
| cv_required | bool | Applying needs a CV (a PDF or a photo). Defaults from the category: on for office, IT, bank, health, education, NGO and government jobs; off for the rest |
| questions | json[] (≤ 3, or ≤ 5 when no CV is required) | {label, type: short_text/yes_no, required} shown on the apply form |
| status | draft · open · closed | Replaces draft/active/expired + hiring_completed + final_shortlist_completed |
| closes_at | timestamp, optional | Open jobs close themselves at this time |
| closed_reason | hired · cancelled · expired | |
| slug | text, unique | Public link `/jobs/{slug}` |

Removed: `auto_shortlist`, `shortlist_threshold`, `shortlist_status`, `final_shortlist_completed`, `hiring_completed`, `required_years_of_experience` (it becomes a must-have).

### Person
One row per human, shared across companies: name, email (lowercase, unique), phone, links. Candidates who never sign in still have a Person. CV files live on the application, so each company sees the CV that was sent to it.

### Application
| Field | Type | Notes |
|---|---|---|
| job_id, person_id | fk | unique together |
| stage | new · shortlisted · interview · offer · hired · rejected · withdrawn | Replaces the 8-value status |
| cv_file, answers, source (linkedin/facebook/merojob/direct/other), consent_at | | |
| decided_by, decided_at | fk/timestamp | Who moved it last |
| rejected_reason | not_a_fit · position_filled · no_response · other, optional | Never shown to the candidate |
| share_* | bool | What the candidate agreed to share |

Removed: `score`, `ml_bouncer_score`, `strengths`, `weaknesses`, `ai_review_*`, `shortlist_notified` (moved to Review and Event).

### Review (AI, one per application)
| Field | Type | Notes |
|---|---|---|
| state | pending · done · failed · needs_person | `needs_person` when the CV is flagged or unreadable |
| fit | strong · possible · weak | What the recruiter sees. No 0–100 number in the UI |
| summary | text, ≤ 140 chars | The one line shown in the list: "6 yrs data pipelines, Airflow/dbt, no Kafka" |
| checks | json[] | per must-have / nice-to-have: {criterion, result: met/partly/missing, evidence: quote from the CV} |
| flag_reason | text | e.g. "Possible hidden instructions in the CV" |
| rank_score | float | Internal sort key only |
| model, prompt_version, created_at | | For audit |

### Event (timeline)
type: applied · stage_changed · email_sent · email_scheduled · interview_booked · interview_done · note · review_done. Fields: actor (person or system), payload, created_at. The candidate panel's activity list is just this table.

### Interview and Scorecard
Interview: application_id, starts_at, ends_at, location_or_link, interviewers[]. Scorecard: interview_id, author, ratings per must-have (1–4), recommendation (strong yes · yes · no · strong no), notes.

### Migration from the current schema
| Now | Becomes |
|---|---|
| status applied | stage new |
| shortlisted | shortlisted |
| interview_booked, interview_completed | interview (interview row says booked or done) |
| offer | offer |
| offer_accepted | hired |
| offer_declined | withdrawn (event: "declined offer") |
| rejected | rejected |
| job active / expired / draft | open / closed (closed_reason expired) / draft |
| hiring_completed = true | closed, closed_reason hired |
| strengths/weaknesses/score | Review (summary from first strength, fit from score bands ≥75 strong, 50–74 possible, <50 weak) |
| overview + arrays | description (joined as headed sections) |
| requirements | must_haves (first 6) |

## 4. Screens

Layout rules for every screen: breadcrumb, title with status pill, one line of facts, at most two actions. No subtitles that describe the page. Uppercase labels only for small eyebrow text, never on every card.

### Today
```
Good afternoon, Priya                                   [Post a job]

Interviews today                     Needs you
10:30  Aashish Basnet · Sr Backend   12 to review   · Senior Backend       →
15:00  Nisha Tamang · Data Platform   1 flagged CV  · Data Platform        →
                                      3 waiting 5+ days                    →
Your jobs                             Closes in 2 days · Frontend Platform →
[role card] [role card] [role card]
  +8 to review  +2 to invite  1 interview today
```

### Post a job (builder, one page with sections, autosave)
1. Paste a description or type a few words → fields filled for you (title, location, work type, salary if found).
2. Must-haves: 3–6 short criteria suggested from the description. Recruiter edits, adds, removes. These drive the review.
3. Questions (optional, up to 3).
4. Publish → Share sheet: copy link, LinkedIn text, Facebook text, QR. Source tags added automatically.

### Job page = the one place for a job
```
Jobs › Senior Backend Engineer
Senior Backend Engineer  ● Open          Kathmandu · Hybrid · NPR 145–215k · Closes 30 Oct
                                                                [Share]  [Edit]
New 12 · Shortlisted 3 · Interview 3 · Offer 0 · Hired 0 · Rejected 8      Sort: Best fit ▾

┌──────────────────────────────┬───────────────────────────────────────────────┐
│ ▢ Nischal Kharel   Strong     │ Nischal Kharel                [Reject] [Shortlist]
│   6 yrs payments, FastAPI     │ nischal@… · +977 98… · Kathmandu · LinkedIn    │
│ ▢ Suraj Pandey     Possible   │                                                │
│   Backend, no Kafka           │ Strong fit                                     │
│ ▶ Binod Acharya    Weak       │ ✓ 3+ yrs Python in production   "Built …"      │
│   Data engineer, not backend  │ ✓ REST API design                "Designed …"  │
│                               │ ~ Payments domain                 "Fintech …"  │
│                               │ ✗ Kafka                                         │
│                               │ Answers  Notice period: 1 month                │
│                               │ CV  [inline preview]                          │
│                               │ Activity  Applied via LinkedIn · 14 Oct       │
│                               │           Review done · 14 Oct                 │
│                               │ [Add a note…]                                  │
└──────────────────────────────┴───────────────────────────────────────────────┘
J/K next · S shortlist · R reject · selected rows show a bulk bar
```
- Split view, never an overlay. The list stays visible; the selected row is highlighted; after a decision the next candidate opens.
- One scroll, no tabs. Order: who → decision buttons → why (fit + checks with quotes) → answers → CV → activity → note.
- Stage moves forward only through the two buttons and the next-stage button for that stage (Shortlisted: "Invite to interview", Interview: "Make offer", Offer: "Mark hired"). A small "More" menu holds Move back and Withdraw.
- Other applications by the same person: one muted line, "Also applied to 2 other roles", linking out. Not cards.
- Flagged CV: a single amber line under the name, "Flagged: possible hidden instructions. Check the CV before deciding." No fit is shown until a person clears the flag.
- No contact block card, no "Applied for" card, no editable AI assessment.

### Decision → email
Shortlist: preview of the invite with the booking link, Send (default) or Edit. Reject: kind template, sent after a 10 s undo toast. Bulk: same, one confirmation for N people.

### Candidates (across jobs)
Table: person, latest job, stage, fit, last activity. Search by name, skill or "who has used Kafka". Opens the same candidate panel.

### Interviews
List grouped by day. Each row: time, applicant, job, video link, and whether notes are in. After the time passes, the row asks "How did it go?".

## 5. Words

| Not | Use |
|---|---|
| Applied (as a stage) | New |
| AI assessment / AI score 69 | Strong fit · Possible fit · Weak fit |
| Initial AI screening 2 of 3 ready ✓0 ✗2 …1 | 2 reviewed · 1 reviewing |
| Change application status | (removed) |
| Outreach | (removed; emails are part of decisions) |
| Expired | Closed |
