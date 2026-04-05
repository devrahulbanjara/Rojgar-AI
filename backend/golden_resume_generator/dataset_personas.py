from __future__ import annotations

from collections import Counter

from dataset_models import ResumeSpec
from dataset_settings import STYLE_TARGET_COUNT, TOTAL_RESUMES


STYLE_DEFINITIONS = {
    "simple_single_column": {
        "label": "simple normal single-column",
        "prompt": (
            "The rendered resume will be a plain, single-column, normal-looking resume. "
            "Keep the content straightforward, readable, and balanced without visual fluff."
        ),
    },
    "double_column_canva": {
        "label": "double-column Canva-style early-career",
        "prompt": (
            "The rendered resume will be a two-column layout similar to the polished Canva-style "
            "resumes many freshers and early-career candidates used in 2020 and earlier. "
            "Keep content concise, visually tidy, and project or internship friendly."
        ),
    },
    "professional_standard": {
        "label": "professional industry-standard",
        "prompt": (
            "The rendered resume will be a conservative, professional, industry-standard layout. "
            "Keep the content strong, businesslike, and credible for experienced hiring workflows."
        ),
    },
}


NEPAL_COLLEGE_REFERENCE_POOL = [
    "Islington College (London Metropolitan University)",
    "The British College (Leeds Beckett University)",
    "ISMT College (University of Sunderland)",
    "Kantipur College of Management and Information Technology (Tribhuvan University)",
    "Nepal College of Information Technology (Pokhara University)",
    "Kathford International College (Tribhuvan University)",
    "Texas College of Management and IT (Lincoln University College)",
    "Thames International College (Tribhuvan University)",
    "IIMS College (University of the West of Scotland)",
    "Padmashree International College (Nilai University)",
    "St. Xavier's College",
    "Kathmandu College of Management (Kathmandu University)",
    "Ace Institute of Management (Pokhara University)",
    "Uniglobe College (Pokhara University)",
    "DAV College (Tribhuvan University)",
]

NEPAL_UNIVERSITY_CONTEXT = [
    "Tribhuvan University",
    "Kathmandu University",
    "Pokhara University",
    "Purbanchal University",
]

NEPAL_COMPANY_REFERENCE_POOL = [
    "Leapfrog Technology",
    "Cotiviti Nepal",
    "F1Soft International",
    "Deerwalk Inc.",
    "CloudFactory Nepal",
    "EB Pearls Nepal",
    "Logpoint Nepal",
    "Braindigit IT Solution",
    "Fusemachines Nepal",
    "Verscend Technologies Nepal",
    "Incessant Rain Studios",
    "SoftNEP",
    "InfoDevelopers Pvt. Ltd.",
    "YoungInnovations",
    "Broadway Infosys",
]

NEPAL_ROLE_REFERENCE_POOL = [
    "Software Engineer",
    "Backend Developer",
    "Frontend Developer",
    "Full Stack Developer",
    "Data Analyst",
    "Data Scientist",
    "AI / ML Engineer",
    "DevOps Engineer",
    "QA Engineer",
    "Cybersecurity Analyst",
    "Business Analyst",
    "Digital Marketing Specialist",
    "Accountant",
    "HR Manager",
    "Project Manager",
]


SIMPLE_PERSONAS = [
    {
        "career_level": "junior",
        "domain": "software engineering",
        "edge_case": "One internship plus 2 to 3 meaningful academic or freelance projects.",
        "company_hint": "F1Soft, eSewa, Khalti, Deerwalk, Braindigit, Leapfrog Technology",
        "education_hint": "Pulchowk Campus, Kathmandu University, Kathmandu Engineering College, Islington College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur, Banepa",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "frontend development",
        "edge_case": "Concise single-page resume with strong React and UI project density.",
        "company_hint": "Leapfrog Technology, Braindigit, F1Soft, Deerwalk, Cotiviti Nepal, Verisk Nepal",
        "education_hint": "Softwarica College, Islington College, Prime College, Kathmandu Model College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "backend engineering",
        "edge_case": "Balanced professional resume with clear ownership of APIs and databases.",
        "company_hint": "Deerwalk, Cotiviti Nepal, Verisk Nepal, F1Soft, CloudFactory Nepal, Fusemachines Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Nepal College of Information Technology, Amrit Campus",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "qa engineering",
        "edge_case": "Strong testing focus, sparse bullets, and limited public links.",
        "company_hint": "F1Soft, Khalti, eSewa, Deerwalk, Verisk Nepal, Ncell",
        "education_hint": "Tribhuvan University, Prime College, Nepal Engineering College, Softwarica College",
        "location_hint": "Kathmandu, Lalitpur, Bharatpur",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "data analysis",
        "edge_case": "No GitHub or portfolio link anywhere on the resume.",
        "company_hint": "Nabil Bank, Global IME Bank, NIC Asia Bank, Nepal Telecom, Daraz Nepal, CG Corp Global",
        "education_hint": "Kathmandu University, Pokhara University, St. Xavier's College, Patan Multiple Campus",
        "location_hint": "Kathmandu, Lalitpur, Hetauda, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "product design",
        "edge_case": "Portfolio present, no GitHub, project-heavy storytelling.",
        "company_hint": "Leapfrog Technology, Braindigit, Daraz Nepal, Foodmandu, F1Soft, Khalti",
        "education_hint": "Kathmandu University, Islington College, Kathmandu Model College, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "mobile development",
        "edge_case": "Several short tenures across Nepal startups, still internally consistent.",
        "company_hint": "Khalti, eSewa, F1Soft, Foodmandu, Daraz Nepal, Ncell",
        "education_hint": "Pokhara University, Softwarica College, Islington College, Kathmandu Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "devops / sre",
        "edge_case": "Certification-heavy profile with infrastructure tooling depth.",
        "company_hint": "CloudFactory Nepal, Cotiviti Nepal, Verisk Nepal, Deerwalk, Leapfrog Technology, Fusemachines Nepal",
        "education_hint": "Pulchowk Campus, Kathmandu University, Nepal Engineering College, Kathmandu Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Bhairahawa",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "digital marketing",
        "edge_case": "Campaign-driven bullets with strong measurable outcomes.",
        "company_hint": "Daraz Nepal, Foodmandu, CG Corp Global, Pathao Nepal, IME Group, Buddha Air",
        "education_hint": "Tribhuvan University, Kathmandu Model College, Prime College, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara, Bharatpur",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "cybersecurity",
        "edge_case": "Certification-heavy and sparse bullet style.",
        "company_hint": "Ncell, Nepal Telecom, Global IME Bank, Nabil Bank, F1Soft, Verisk Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Softwarica College, Nepal Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Dharan",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "product management",
        "edge_case": "No GitHub profile, but does have a portfolio website.",
        "company_hint": "Khalti, eSewa, F1Soft, Daraz Nepal, Foodmandu, Ncell",
        "education_hint": "Kathmandu University, Tribhuvan University, Islington College, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "finance operations",
        "edge_case": "Corporate progression across banking and payments roles.",
        "company_hint": "Nabil Bank, NIC Asia Bank, Global IME Bank, IME Group, Khalti, eSewa",
        "education_hint": "Tribhuvan University, Kathmandu University School of Management, Apex College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Biratnagar, Butwal",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "human resources",
        "edge_case": "Transition from recruiter to HR business partner with operational depth.",
        "company_hint": "CG Corp Global, Sipradi, Ncell, Buddha Air, Daraz Nepal, IME Group",
        "education_hint": "Tribhuvan University, Kathmandu University, Patan Multiple Campus, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Hetauda, Nepalgunj",
        "date_style": "month_year",
    },
    {
        "career_level": "lead",
        "domain": "engineering management",
        "edge_case": "Transitioned from IC roles into team leadership and delivery management.",
        "company_hint": "Deerwalk, Cotiviti Nepal, Leapfrog Technology, F1Soft, Verisk Nepal, CloudFactory Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Tribhuvan University, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "lead",
        "domain": "business operations",
        "edge_case": "Very sparse resume with minimal detail but still realistic and credible.",
        "company_hint": "CG Corp Global, Sipradi, IME Group, Buddha Air, Yeti Airlines, Foodmandu",
        "education_hint": "Tribhuvan University, Pokhara University, Purbanchal University, Kathmandu Model College",
        "location_hint": "Kathmandu, Bharatpur, Biratnagar, Butwal",
        "date_style": "year_only",
    },
]


DOUBLE_COLUMN_PERSONAS = [
    {
        "career_level": "intern",
        "domain": "software engineering",
        "edge_case": "No formal work experience, only projects, hackathons, and one campus club role.",
        "company_hint": "F1Soft, eSewa, Khalti, Deerwalk, Leapfrog Technology",
        "education_hint": "Pulchowk Campus, Kathmandu University, Islington College, Softwarica College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur, Banepa",
        "date_style": "month_year",
    },
    {
        "career_level": "intern",
        "domain": "data science",
        "edge_case": "Student profile with coursework, hackathons, and one research assistantship.",
        "company_hint": "Fusemachines Nepal, Deerwalk, CloudFactory Nepal, Verisk Nepal, Kathmandu Living Labs",
        "education_hint": "Kathmandu University, Tribhuvan University, St. Xavier's College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "frontend development",
        "edge_case": "Fresh graduate with internship plus portfolio-heavy presentation.",
        "company_hint": "Braindigit, Leapfrog Technology, Daraz Nepal, Foodmandu, F1Soft",
        "education_hint": "Islington College, Softwarica College, Kathmandu Model College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "backend development",
        "edge_case": "Fresh graduate with only internships and academic capstone work.",
        "company_hint": "F1Soft, Deerwalk, Cotiviti Nepal, Verisk Nepal, CloudFactory Nepal",
        "education_hint": "Kathmandu Engineering College, Nepal Engineering College, Pulchowk Campus, Amrit Campus",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "qa engineering",
        "edge_case": "Limited experience, strong education, and manual plus automation testing focus.",
        "company_hint": "Khalti, eSewa, F1Soft, Ncell, Nepal Telecom, Deerwalk",
        "education_hint": "Softwarica College, Prime College, Tribhuvan University, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Bharatpur",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "ux/ui design",
        "edge_case": "Project-heavy resume with strong portfolio and no formal full-time role yet.",
        "company_hint": "Leapfrog Technology, Braindigit, Daraz Nepal, Foodmandu, Khalti",
        "education_hint": "Kathmandu University, Islington College, Kathmandu Model College, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Bhaktapur",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "digital marketing",
        "edge_case": "Internships plus freelance campaign work for local Nepal businesses.",
        "company_hint": "Daraz Nepal, Foodmandu, CG Corp Global, Buddha Air, IME Group, Pathao Nepal",
        "education_hint": "Tribhuvan University, Prime College, Kathmandu Model College, Patan Multiple Campus",
        "location_hint": "Kathmandu, Lalitpur, Pokhara, Bharatpur",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "business analysis",
        "edge_case": "Strong academic performance and one banking internship.",
        "company_hint": "Nabil Bank, NIC Asia Bank, Global IME Bank, IME Group, Khalti",
        "education_hint": "Kathmandu University School of Management, Tribhuvan University, Apex College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Hetauda",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "mobile app development",
        "edge_case": "Student projects and one startup internship, mostly Android-focused.",
        "company_hint": "Khalti, eSewa, F1Soft, Foodmandu, Ncell, Nepal Telecom",
        "education_hint": "Islington College, Softwarica College, Pokhara University, Kathmandu Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "junior",
        "domain": "customer success",
        "edge_case": "Call-center and service operations experience with clean concise bullets.",
        "company_hint": "Ncell, Nepal Telecom, Daraz Nepal, Foodmandu, Khalti, IME Group",
        "education_hint": "Tribhuvan University, Purbanchal University, Kathmandu Model College, Patan Multiple Campus",
        "location_hint": "Kathmandu, Bharatpur, Itahari, Biratnagar",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "data analysis",
        "edge_case": "Early-career analyst profile with strong dashboard and reporting projects.",
        "company_hint": "Nabil Bank, Global IME Bank, Nepal Telecom, Daraz Nepal, CG Corp Global, IME Group",
        "education_hint": "Kathmandu University, Tribhuvan University, Pokhara University, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "human resources",
        "edge_case": "Compact two-column resume with internships, one HR executive role, and campus leadership.",
        "company_hint": "CG Corp Global, Sipradi, Ncell, Buddha Air, Yeti Airlines, IME Group",
        "education_hint": "Tribhuvan University, Kathmandu University, Patan Multiple Campus, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Butwal",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "finance operations",
        "edge_case": "Month-and-year dates only, no exact days implied anywhere.",
        "company_hint": "Nabil Bank, NIC Asia Bank, Global IME Bank, IME Group, Khalti, eSewa",
        "education_hint": "Tribhuvan University, Kathmandu University School of Management, Apex College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Biratnagar",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "operations coordination",
        "edge_case": "Mix of internship, full-time, and volunteer work presented in a youthful style.",
        "company_hint": "Buddha Air, Yeti Airlines, Sipradi, Daraz Nepal, Foodmandu, CG Corp Global",
        "education_hint": "Pokhara University, Tribhuvan University, Purbanchal University, Kathmandu Model College",
        "location_hint": "Kathmandu, Pokhara, Bharatpur, Bhairahawa",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "content and communications",
        "edge_case": "Portfolio website present, no LinkedIn URL, and strong campus editorial work.",
        "company_hint": "Daraz Nepal, CG Corp Global, Foodmandu, IME Group, Buddha Air, Pathao Nepal",
        "education_hint": "St. Xavier's College, Tribhuvan University, Kathmandu Model College, Prime College",
        "location_hint": "Kathmandu, Lalitpur, Janakpur",
        "date_style": "month_year",
    },
]


PROFESSIONAL_PERSONAS = [
    {
        "career_level": "mid",
        "domain": "backend engineering",
        "edge_case": "Professional but not flashy, with clear service ownership and migration work.",
        "company_hint": "Deerwalk, Cotiviti Nepal, Verisk Nepal, F1Soft, CloudFactory Nepal, Fusemachines Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Nepal Engineering College, Amrit Campus",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "platform engineering",
        "edge_case": "More than 12 listed skills but still disciplined and readable.",
        "company_hint": "CloudFactory Nepal, Cotiviti Nepal, Verisk Nepal, Deerwalk, Leapfrog Technology, Fusemachines Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Kathmandu Engineering College, Nepal Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Hetauda",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "full stack development",
        "edge_case": "Freelance plus full-time employment mixed together with sensible chronology.",
        "company_hint": "Braindigit, Leapfrog Technology, Deerwalk, F1Soft, Khalti, Foodmandu",
        "education_hint": "Islington College, Softwarica College, Kathmandu University, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "machine learning engineering",
        "edge_case": "Production ML systems with one publication or workshop mention folded into experience bullets.",
        "company_hint": "Fusemachines Nepal, Deerwalk, Verisk Nepal, CloudFactory Nepal, Cotiviti Nepal",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Dharan",
        "date_style": "month_year",
    },
    {
        "career_level": "mid",
        "domain": "cloud architecture",
        "edge_case": "AWS-centric profile with certification coverage and pragmatic delivery bullets.",
        "company_hint": "CloudFactory Nepal, Cotiviti Nepal, Verisk Nepal, F1Soft, Deerwalk, Ncell",
        "education_hint": "Kathmandu University, Pulchowk Campus, Nepal Engineering College, Kathmandu Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Bhairahawa",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "data engineering",
        "edge_case": "Long career across several Nepal companies with clear warehouse and ETL ownership.",
        "company_hint": "Fusemachines Nepal, Deerwalk, Verisk Nepal, Cotiviti Nepal, CloudFactory Nepal, Nabil Bank",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Biratnagar",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "machine learning",
        "edge_case": "One-year employment gap handled naturally and professionally.",
        "company_hint": "Fusemachines Nepal, Deerwalk, CloudFactory Nepal, Verisk Nepal, Cotiviti Nepal",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, St. Xavier's College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "fintech engineering",
        "edge_case": "Compliance-heavy role descriptions and regulated systems work.",
        "company_hint": "F1Soft, eSewa, Khalti, Nabil Bank, Global IME Bank, NIC Asia Bank",
        "education_hint": "Kathmandu University, Pulchowk Campus, Nepal Engineering College, Tribhuvan University",
        "location_hint": "Kathmandu, Lalitpur, Biratnagar",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "software engineering",
        "edge_case": "Career changer from finance into engineering with believable chronology.",
        "company_hint": "Nabil Bank, NIC Asia Bank, Global IME Bank, F1Soft, Khalti, eSewa",
        "education_hint": "Tribhuvan University, Kathmandu University, Islington College, Softwarica College",
        "location_hint": "Kathmandu, Lalitpur, Hetauda",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "engineering management",
        "edge_case": "People leadership across multiple teams and a prior hands-on engineering phase.",
        "company_hint": "Deerwalk, Cotiviti Nepal, Leapfrog Technology, Verisk Nepal, F1Soft, CloudFactory Nepal",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "senior",
        "domain": "cybersecurity",
        "edge_case": "Professional security profile with governance plus hands-on incident response depth.",
        "company_hint": "Ncell, Nepal Telecom, Nabil Bank, Global IME Bank, F1Soft, Verisk Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Softwarica College, Nepal Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Dharan",
        "date_style": "month_year",
    },
    {
        "career_level": "lead",
        "domain": "product engineering",
        "edge_case": "Dense technical summary and large-scale systems work without becoming exaggerated.",
        "company_hint": "F1Soft, eSewa, Khalti, Deerwalk, Leapfrog Technology, Verisk Nepal",
        "education_hint": "Kathmandu University, Pulchowk Campus, Nepal Engineering College, Islington College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
    {
        "career_level": "lead",
        "domain": "data platform",
        "edge_case": "More than 10 years of experience across 5 to 6 real Nepal organizations.",
        "company_hint": "Deerwalk, Cotiviti Nepal, Verisk Nepal, Fusemachines Nepal, Nabil Bank, Nepal Telecom",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, Pokhara University",
        "location_hint": "Kathmandu, Lalitpur, Bharatpur",
        "date_style": "month_year",
    },
    {
        "career_level": "lead",
        "domain": "operations leadership",
        "edge_case": "Operational resume covering airline, mobility, or logistics businesses in Nepal.",
        "company_hint": "Buddha Air, Yeti Airlines, Sipradi, Daraz Nepal, Foodmandu, IME Group",
        "education_hint": "Tribhuvan University, Pokhara University, Purbanchal University, Prime College",
        "location_hint": "Kathmandu, Pokhara, Bharatpur, Bhairahawa",
        "date_style": "month_year",
    },
    {
        "career_level": "principal",
        "domain": "platform engineering",
        "edge_case": "Overlapping consulting engagements and advisory work handled cleanly.",
        "company_hint": "CloudFactory Nepal, Cotiviti Nepal, Verisk Nepal, Deerwalk, Leapfrog Technology, F1Soft",
        "education_hint": "Kathmandu University, Tribhuvan University, Pulchowk Campus, Nepal Engineering College",
        "location_hint": "Kathmandu, Lalitpur, Pokhara",
        "date_style": "month_year",
    },
]


GROUPED_PERSONAS = {
    "simple_single_column": SIMPLE_PERSONAS,
    "double_column_canva": DOUBLE_COLUMN_PERSONAS,
    "professional_standard": PROFESSIONAL_PERSONAS,
}


def build_resume_specs() -> list[ResumeSpec]:
    specs: list[ResumeSpec] = []

    for style_key, personas in GROUPED_PERSONAS.items():
        style_definition = STYLE_DEFINITIONS[style_key]
        for style_bucket_index, persona in enumerate(personas, start=1):
            specs.append(
                ResumeSpec(
                    index=len(specs) + 1,
                    style_key=style_key,
                    style_label=style_definition["label"],
                    style_bucket_index=style_bucket_index,
                    style_prompt=style_definition["prompt"],
                    career_level=persona["career_level"],
                    domain=persona["domain"],
                    edge_case=persona["edge_case"],
                    company_hint=persona["company_hint"],
                    education_hint=persona["education_hint"],
                    location_hint=persona["location_hint"],
                    date_style=persona["date_style"],
                    render_variant=((style_bucket_index - 1) % 5) + 1,
                )
            )

    validate_resume_specs(specs)
    return specs


def validate_resume_specs(specs: list[ResumeSpec]) -> None:
    if len(specs) != TOTAL_RESUMES:
        raise ValueError(
            f"Expected exactly {TOTAL_RESUMES} resume specs, found {len(specs)}."
        )

    style_counts = Counter(spec.style_key for spec in specs)
    for style_key in STYLE_DEFINITIONS:
        actual = style_counts.get(style_key, 0)
        if actual != STYLE_TARGET_COUNT:
            raise ValueError(
                f"Style '{style_key}' must have {STYLE_TARGET_COUNT} resumes, found {actual}."
            )

    style_bucket_counts = Counter(
        (spec.style_key, spec.style_bucket_index) for spec in specs
    )
    if any(count != 1 for count in style_bucket_counts.values()):
        raise ValueError("Each style bucket index must be unique within its style.")
