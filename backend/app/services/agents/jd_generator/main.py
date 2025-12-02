from . import app, reference_jd
from app.core import logger

thread_config = {"configurable": {"thread_id": "convexhire"}}

initial_state = {
    "requirements": "Senior Machine Learning Engineer, 4+ years exp, Should be interested in teaching and mentoring students, 50% engineering , 50% training students for AWS Certified MLA-C01",
    "format_reference": reference_jd,
    "revision_count": 0,
}

for event in app.stream(initial_state, thread_config):
    pass

while True:
    current_values = app.get_state(thread_config).values
    draft = current_values.get("draft")

    print(f"\nCURRENT DRAFT (Revision {current_values.get('revision_count')})")
    print("=" * 60)

    if draft:
        print(f"\n# ROLE: {draft.role_overview}\n")
        print(f"## ABOUT THE COMPANY")
        print(f"{draft.about_the_company}\n")
        print(f"## REQUIREMENTS")
        for item in draft.required_skills_and_experience:
            print(f"• {item}")
        print(f"\n## NICE TO HAVE")
        for item in draft.nice_to_have:
            print(f"• {item}")
        print(f"\n## WHAT WE OFFER")
        for item in draft.what_company_offers:
            print(f"• {item}")

    logger.info("\n\n\n\n##### Type 'approved' to finish, or enter feedback to revise: ")
    user_input = input()

    app.update_state(thread_config, {"feedback": user_input}, as_node="human_review")
    finished = False

    for event in app.stream(None, thread_config):
        if "finalizer" in event:
            finished = True

    if finished:
        final_state = app.get_state(thread_config).values
        print("\n" + "=" * 60)
        print("FINAL JOB DESCRIPTION")
        print("=" * 60)
        print(final_state["final_doc"])
        break
