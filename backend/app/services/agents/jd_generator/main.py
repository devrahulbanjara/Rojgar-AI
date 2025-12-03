from . import app, reference_jd
from langgraph.types import Command

thread_config = {"configurable": {"thread_id": "jd-thread-001"}}

initial_state = {
    "requirements": "Senior Machine Learning Engineer, 4+ years experience, interest in teaching and mentoring students, 50% engineering work, 50% training students for AWS Certified MLA-C01",
    "format_reference": reference_jd,
    "revision_count": 0,
}

result = app.invoke(initial_state, config=thread_config)

while "__interrupt__" in result:
    payload = result["__interrupt__"][0].value

    print(f"\n{'='*70}")
    print(f"DRAFT REVIEW - Revision {payload['revision_number']}")
    print("=" * 70)

    print(f"\n## ABOUT THE COMPANY")
    print(payload["about_company"])

    print(f"\n## ROLE OVERVIEW")
    print(payload["role"])

    print(f"\n## REQUIRED SKILLS & EXPERIENCE")
    for item in payload["requirements"]:
        print(f"  • {item}")

    print(f"\n## NICE TO HAVE")
    for item in payload["nice_to_have"]:
        print(f"  • {item}")

    print(f"\n## WHAT WE OFFER")
    for item in payload["offers"]:
        print(f"  • {item}")

    user_input = input("\n>>> Type 'approved' to finish, or provide feedback: ").strip()

    result = app.invoke(Command(resume=user_input), config=thread_config)

print("\n" + "=" * 70)
print("FINAL JOB DESCRIPTION")
print("=" * 70)
print(result["final_doc"])
