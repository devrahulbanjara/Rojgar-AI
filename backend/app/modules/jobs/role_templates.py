"""Ready-made role templates for common jobs in Nepal.

A recruiter picks one when posting a job: title, must-haves, nice-to-haves and
knockout questions are filled in and stay editable. Salaries are NPR per month
(the minimum wage is NPR 17,300 from FY 2080/81). Every template passes the
protected-grounds check (see `protected_grounds.py`).
"""

from __future__ import annotations

from typing import Literal

from app.core.schemas import BaseSchema
from app.shared.enums import EmploymentType, JobCategory


class RoleTemplateQuestion(BaseSchema):
    label: str
    type: Literal["short_text", "yes_no"]
    required: bool = True
    # For yes/no questions: the answer a person must give to be eligible.
    knockout_answer: Literal["yes", "no"] | None = None


class RoleTemplate(BaseSchema):
    key: str
    title: str
    category: JobCategory
    employment_type: EmploymentType
    salary_min: int
    salary_max: int
    currency: str = "NPR"
    description: str
    must_haves: list[str]
    nice_to_haves: list[str]
    questions: list[RoleTemplateQuestion]


def _yes(label: str) -> dict:
    return {
        "label": label,
        "type": "yes_no",
        "required": True,
        "knockout_answer": "yes",
    }


def _ask(label: str, required: bool = True) -> dict:
    return {
        "label": label,
        "type": "short_text",
        "required": required,
        "knockout_answer": None,
    }


ROLE_TEMPLATES: list[dict] = [
    {
        "key": "bank-trainee-teller",
        "title": "Trainee Assistant (Teller)",
        "category": "banking_finance",
        "employment_type": "full_time",
        "salary_min": 30000,
        "salary_max": 40000,
        "description": "Serve customers at the cash counter: deposits, withdrawals and "
        "account enquiries.\n\nFull training is given in the first three months.",
        "must_haves": [
            "Bachelor's degree (any stream) completed",
            "Accurate with cash counting",
            "Comfortable using a computer for daily entries",
            "Polite, clear communication with customers",
        ],
        "nice_to_haves": [
            "Previous counter or cash-handling work",
            "Banking or finance coursework",
        ],
        "questions": [
            _yes("Have you completed a bachelor's degree?"),
            _ask("Which branch locations can you work at?"),
        ],
    },
    {
        "key": "staff-nurse",
        "title": "Staff Nurse",
        "category": "healthcare",
        "employment_type": "full_time",
        "salary_min": 28000,
        "salary_max": 42000,
        "description": "Provide patient care on the ward, give medicines as prescribed "
        "and keep accurate nursing records.\n\nRotating shifts, including nights.",
        "must_haves": [
            "PCL or B.Sc. Nursing completed",
            "Valid Nepal Nursing Council (NNC) licence",
            "Able to work rotating shifts including nights",
            "Knows basic life support and infection control",
        ],
        "nice_to_haves": [
            "1+ year of ward experience in a hospital",
            "ICU, emergency or maternity ward experience",
        ],
        "questions": [
            _yes("Do you hold a valid NNC licence?"),
            _yes("Can you work night shifts?"),
            _ask("Which wards have you worked in?", required=False),
        ],
    },
    {
        "key": "school-teacher",
        "title": "Secondary Level Teacher",
        "category": "education",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 40000,
        "description": "Teach your subject to grades 9-10, prepare lesson plans and "
        "track student progress.",
        "must_haves": [
            "Bachelor's degree in the subject taught",
            "Teaching licence from the Teacher Service Commission (TSC)",
            "1+ year of classroom teaching",
            "Can prepare lesson plans and assess students",
        ],
        "nice_to_haves": [
            "B.Ed. or M.Ed. completed",
            "Experience preparing students for the SEE",
        ],
        "questions": [
            _yes("Do you hold a TSC teaching licence?"),
            _ask("Which subject and grades have you taught?"),
        ],
    },
    {
        "key": "driver",
        "title": "Driver",
        "category": "logistics_driving",
        "employment_type": "full_time",
        "salary_min": 22000,
        "salary_max": 32000,
        "description": "Drive the company vehicle safely, keep the logbook and take care "
        "of basic vehicle upkeep.",
        "must_haves": [
            "Valid driving licence for the vehicle category (B for cars, C for vans/jeeps)",
            "2+ years of driving experience",
            "Clean driving record with no major accidents",
            "Knows the routes in the working area",
        ],
        "nice_to_haves": [
            "Basic vehicle maintenance skills",
            "Experience driving on highways or hill roads",
        ],
        "questions": [
            _yes("Do you hold a valid driving licence for this vehicle category?"),
            _ask("Which licence category do you hold?"),
        ],
    },
    {
        "key": "security-guard",
        "title": "Security Guard",
        "category": "other",
        "employment_type": "full_time",
        "salary_min": 17300,
        "salary_max": 23000,
        "description": "Guard the premises, check visitors and vehicles and write the "
        "daily security log.\n\nDay and night shifts.",
        "must_haves": [
            "Able to work day and night shifts",
            "Able to stand and patrol for a full shift",
            "Can keep a written visitor and incident log",
        ],
        "nice_to_haves": [
            "Previous security or guard work",
            "First-aid or fire-safety training",
        ],
        "questions": [
            _yes("Can you work night shifts?"),
            _ask("Where have you worked as a guard before?", required=False),
        ],
    },
    {
        "key": "waiter",
        "title": "Waiter / Waitress",
        "category": "hospitality_tourism",
        "employment_type": "full_time",
        "salary_min": 17300,
        "salary_max": 23000,
        "description": "Take orders, serve food and drinks and keep tables clean.\n\n"
        "Service charge is shared on top of the salary.",
        "must_haves": [
            "Polite and friendly with guests",
            "Can take orders accurately",
            "Able to work evening and weekend shifts",
        ],
        "nice_to_haves": [
            "Previous restaurant or hotel service work",
            "Basic spoken English for tourist guests",
        ],
        "questions": [
            _yes("Can you work evening and weekend shifts?"),
            _ask("Where have you served before?", required=False),
        ],
    },
    {
        "key": "cook",
        "title": "Cook",
        "category": "hospitality_tourism",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 45000,
        "description": "Prepare dishes from the menu, keep the kitchen clean and follow "
        "food-safety rules.",
        "must_haves": [
            "2+ years of cooking in a restaurant or hotel kitchen",
            "Can cook Nepali and Indian dishes",
            "Follows kitchen hygiene and food-safety rules",
        ],
        "nice_to_haves": [
            "Continental or Chinese cuisine",
            "Culinary or hotel-management training",
        ],
        "questions": [
            _ask("Which cuisines can you cook?"),
            _ask("Where have you worked as a cook?"),
        ],
    },
    {
        "key": "housekeeping-attendant",
        "title": "Housekeeping Attendant",
        "category": "hospitality_tourism",
        "employment_type": "full_time",
        "salary_min": 17300,
        "salary_max": 22000,
        "description": "Clean and prepare guest rooms and public areas to the hotel's "
        "standard.",
        "must_haves": [
            "Can clean and set up rooms to a checklist",
            "Careful with guests' belongings",
            "Able to work shifts including weekends",
        ],
        "nice_to_haves": [
            "Previous hotel housekeeping work",
            "Laundry or linen-room experience",
        ],
        "questions": [
            _yes("Can you work weekend shifts?"),
        ],
    },
    {
        "key": "garment-machine-operator",
        "title": "Garment Machine Operator",
        "category": "manufacturing",
        "employment_type": "full_time",
        "salary_min": 17300,
        "salary_max": 25000,
        "description": "Operate sewing machines on the production line and meet daily "
        "output and quality targets.",
        "must_haves": [
            "Can operate a single-needle or overlock sewing machine",
            "Can meet daily production targets",
            "Follows quality and safety instructions",
        ],
        "nice_to_haves": [
            "1+ year in a garment factory",
            "Can operate more than one machine type",
        ],
        "questions": [
            _ask("Which sewing machines can you operate?"),
            _yes("Can you work overtime when orders are high?"),
        ],
    },
    {
        "key": "sales-representative",
        "title": "Sales Representative",
        "category": "sales_retail",
        "employment_type": "full_time",
        "salary_min": 22000,
        "salary_max": 35000,
        "description": "Visit shops and customers in your area, take orders and grow "
        "sales.\n\nMonthly incentive on top of the salary.",
        "must_haves": [
            "1+ year of field sales or shop sales",
            "Can travel daily within the assigned area",
            "Comfortable talking to shop owners and customers",
            "Can keep simple daily sales records",
        ],
        "nice_to_haves": [
            "Own two-wheeler with a valid licence",
            "FMCG or distribution experience",
        ],
        "questions": [
            _yes("Can you travel daily within the area?"),
            _ask("What did you sell before?", required=False),
        ],
    },
    {
        "key": "accountant",
        "title": "Accountant",
        "category": "banking_finance",
        "employment_type": "full_time",
        "salary_min": 30000,
        "salary_max": 50000,
        "description": "Keep the books, prepare VAT and TDS returns and the monthly "
        "accounts.",
        "must_haves": [
            "BBS, BBA or equivalent in accounting",
            "2+ years of bookkeeping or accounts work",
            "Can file VAT and TDS returns with the IRD",
            "Uses Tally or similar accounting software",
        ],
        "nice_to_haves": [
            "Audit or CA articleship experience",
            "Payroll and SSF filing",
        ],
        "questions": [
            _yes("Have you filed VAT returns before?"),
            _ask("Which accounting software have you used?"),
        ],
    },
    {
        "key": "ngo-field-officer",
        "title": "Field Officer",
        "category": "ngo_ingo",
        "employment_type": "contract",
        "salary_min": 35000,
        "salary_max": 55000,
        "description": "Run project activities in the community, work with local "
        "partners and report progress.",
        "must_haves": [
            "Bachelor's degree in social science or a related field",
            "1+ year of community or project field work",
            "Can travel and stay in project districts",
            "Can write activity reports",
        ],
        "nice_to_haves": [
            "Speaks the local language of the project area",
            "Experience with KoBo or mobile data collection",
        ],
        "questions": [
            _yes("Can you stay in the project district during the contract?"),
            _ask("Which projects have you worked on?"),
        ],
    },
    {
        "key": "receptionist",
        "title": "Receptionist",
        "category": "office_admin",
        "employment_type": "full_time",
        "salary_min": 20000,
        "salary_max": 30000,
        "description": "Welcome visitors, answer calls and manage appointments.",
        "must_haves": [
            "+2 or higher completed",
            "Clear spoken Nepali and English",
            "Can use a computer for email and bookings",
        ],
        "nice_to_haves": [
            "Previous front-desk work",
            "Typing in Nepali (Preeti/Unicode)",
        ],
        "questions": [
            _ask("Where have you worked at a front desk?", required=False),
        ],
    },
    {
        "key": "store-supervisor",
        "title": "Store Supervisor",
        "category": "sales_retail",
        "employment_type": "full_time",
        "salary_min": 30000,
        "salary_max": 45000,
        "description": "Run the shop floor: staff rosters, stock, displays and daily "
        "cash reconciliation.",
        "must_haves": [
            "2+ years in retail, including 1 year leading a team",
            "Can manage stock counts and reorders",
            "Can reconcile daily sales and cash",
        ],
        "nice_to_haves": [
            "Supermarket or chain-store experience",
            "Uses a POS or inventory system",
        ],
        "questions": [
            _ask("How many staff have you supervised?"),
        ],
    },
    {
        "key": "cashier",
        "title": "Cashier",
        "category": "sales_retail",
        "employment_type": "full_time",
        "salary_min": 18000,
        "salary_max": 25000,
        "description": "Bill customers at the counter, handle cash and digital payments "
        "and close the till each day.",
        "must_haves": [
            "Accurate with cash and change",
            "Can use a billing (POS) machine",
            "Knows QR payments such as eSewa, Khalti or Fonepay",
        ],
        "nice_to_haves": [
            "Previous cashier work",
        ],
        "questions": [
            _yes("Have you handled cash at a counter before?"),
        ],
    },
    {
        "key": "delivery-rider",
        "title": "Delivery Rider",
        "category": "logistics_driving",
        "employment_type": "full_time",
        "salary_min": 20000,
        "salary_max": 30000,
        "description": "Deliver orders on time across the city and collect payments "
        "where needed.",
        "must_haves": [
            "Valid two-wheeler driving licence (category A)",
            "Own motorbike or scooter",
            "Knows the city's roads and areas",
            "Has a smartphone for the delivery app",
        ],
        "nice_to_haves": [
            "Previous delivery or courier work",
        ],
        "questions": [
            _yes("Do you hold a valid two-wheeler licence?"),
            _yes("Do you have your own motorbike or scooter?"),
        ],
    },
    {
        "key": "lab-technician",
        "title": "Laboratory Technician",
        "category": "healthcare",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 40000,
        "description": "Collect samples, run routine lab tests and record results "
        "accurately.",
        "must_haves": [
            "Diploma or bachelor's in Medical Laboratory Technology",
            "Registered with the Nepal Health Professional Council (NHPC)",
            "Can run haematology and biochemistry tests",
        ],
        "nice_to_haves": [
            "1+ year in a hospital or diagnostic lab",
            "Microbiology experience",
        ],
        "questions": [
            _yes("Are you registered with the NHPC?"),
        ],
    },
    {
        "key": "pharmacist",
        "title": "Pharmacist",
        "category": "healthcare",
        "employment_type": "full_time",
        "salary_min": 35000,
        "salary_max": 55000,
        "description": "Dispense medicines against prescriptions, advise customers and "
        "manage pharmacy stock.",
        "must_haves": [
            "B.Pharm completed",
            "Registered with the Nepal Pharmacy Council (NPC)",
            "Can check prescriptions and dosages",
            "Can manage medicine stock and expiry dates",
        ],
        "nice_to_haves": [
            "Hospital or retail pharmacy experience",
        ],
        "questions": [
            _yes("Are you registered with the Nepal Pharmacy Council?"),
        ],
    },
    {
        "key": "school-admin-officer",
        "title": "School Administration Officer",
        "category": "education",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 40000,
        "description": "Handle admissions, fee records, parent communication and school "
        "office work.",
        "must_haves": [
            "Bachelor's degree completed",
            "Can keep student and fee records on a computer",
            "Clear communication with parents",
        ],
        "nice_to_haves": [
            "School or college office experience",
            "Uses a school management system",
        ],
        "questions": [
            _ask("What office work have you done before?"),
        ],
    },
    {
        "key": "it-support",
        "title": "IT Support Officer",
        "category": "it_software",
        "employment_type": "full_time",
        "salary_min": 30000,
        "salary_max": 50000,
        "description": "Set up and fix computers, printers and the office network; help "
        "staff with everyday IT problems.",
        "must_haves": [
            "Can install and troubleshoot Windows PCs and printers",
            "Basic networking: Wi-Fi, routers, LAN cabling",
            "1+ year of IT support or hardware work",
        ],
        "nice_to_haves": [
            "CCNA or similar certification",
            "Experience with CCTV or biometric attendance systems",
        ],
        "questions": [
            _ask("What IT problems have you fixed most often?"),
        ],
    },
    {
        "key": "customer-service",
        "title": "Customer Service Representative",
        "category": "office_admin",
        "employment_type": "full_time",
        "salary_min": 20000,
        "salary_max": 30000,
        "description": "Answer customer calls and messages, solve problems and log every "
        "case.",
        "must_haves": [
            "Clear spoken Nepali",
            "Patient and polite on the phone",
            "Can type and log cases on a computer",
        ],
        "nice_to_haves": [
            "Call-centre experience",
            "Spoken English or Hindi",
        ],
        "questions": [
            _yes("Can you work in shifts?"),
        ],
    },
    {
        "key": "marketing-officer",
        "title": "Marketing Officer",
        "category": "sales_retail",
        "employment_type": "full_time",
        "salary_min": 30000,
        "salary_max": 50000,
        "description": "Plan promotions, run the business's social media and work with "
        "local partners and media.",
        "must_haves": [
            "Bachelor's degree in business or marketing",
            "1+ year running promotions or social media for a business",
            "Can write clear posts in Nepali and English",
        ],
        "nice_to_haves": [
            "Facebook and TikTok ads experience",
            "Basic design with Canva",
        ],
        "questions": [
            _ask("Share a page or campaign you have run", required=False),
        ],
    },
    {
        "key": "microfinance-field-officer",
        "title": "Microfinance Field Officer",
        "category": "banking_finance",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 35000,
        "description": "Run centre meetings, collect loan repayments and assess new "
        "members in your area.",
        "must_haves": [
            "+2 or higher completed",
            "Own two-wheeler with a valid licence",
            "Can travel daily to village centres",
            "Careful with cash collection records",
        ],
        "nice_to_haves": [
            "Previous microfinance or cooperative work",
        ],
        "questions": [
            _yes("Do you have your own two-wheeler and licence?"),
            _yes("Can you be posted outside your home district?"),
        ],
    },
    {
        "key": "electrician",
        "title": "Electrician",
        "category": "construction_engineering",
        "employment_type": "full_time",
        "salary_min": 25000,
        "salary_max": 40000,
        "description": "Install and repair wiring, panels and electrical fittings in "
        "buildings, following safety rules.",
        "must_haves": [
            "Electrician training (CTEVT or equivalent)",
            "2+ years of house or building wiring",
            "Follows electrical safety practice",
        ],
        "nice_to_haves": [
            "Industrial or three-phase wiring",
            "Solar installation experience",
        ],
        "questions": [
            _ask("What kind of wiring work have you done?"),
        ],
    },
    {
        "key": "hotel-front-office",
        "title": "Front Office Associate",
        "category": "hospitality_tourism",
        "employment_type": "full_time",
        "salary_min": 22000,
        "salary_max": 35000,
        "description": "Check guests in and out, handle reservations and help guests "
        "with travel and local information.",
        "must_haves": [
            "Spoken English good enough to help foreign guests",
            "Can use a hotel booking system or learn one quickly",
            "Able to work rotating shifts including nights",
        ],
        "nice_to_haves": [
            "Hotel management course",
            "Previous front-desk work in a hotel",
        ],
        "questions": [
            _yes("Can you work night shifts?"),
            _ask("Which hotels have you worked in?", required=False),
        ],
    },
    {
        "key": "office-assistant",
        "title": "Office Assistant",
        "category": "office_admin",
        "employment_type": "full_time",
        "salary_min": 17300,
        "salary_max": 22000,
        "description": "Keep the office running: filing, errands, tea service and "
        "helping staff with daily tasks.",
        "must_haves": [
            "SEE pass or higher",
            "Reliable and on time every day",
            "Can do bank and office errands",
        ],
        "nice_to_haves": [
            "Own two-wheeler with a valid licence",
        ],
        "questions": [
            _yes("Can you start within two weeks?"),
        ],
    },
]


def list_templates(category: str | None = None) -> list[dict]:
    """All templates, or those in one category (JobCategory value)."""
    if category is None:
        return list(ROLE_TEMPLATES)
    value = getattr(category, "value", category)
    return [t for t in ROLE_TEMPLATES if t["category"] == value]
