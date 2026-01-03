from langgraph.types import Command

from . import app, reference_jd

thread_config = {
    "configurable": {"thread_id": "jd-thread-001"},
    "run_name": "jd_generation_workflow",
    "tags": ["jd_generation", "langgraph", "job_description", "demo"],
    "metadata": {
        "thread_id": "jd-thread-001",
        "workflow": "jd_generator",
        "mode": "demo",
    },
}

initial_state = {
    "requirements": "Senior Machine Learning Engineer, 4+ years experience, interest in teaching and mentoring students, 50% engineering work, 50% training students for AWS Certified MLA-C01",
    "format_reference": reference_jd,
    "revision_count": 0,
}

result = app.invoke(initial_state, config=thread_config)

while "__interrupt__" in result:
    payload = result["__interrupt__"][0].value

    print(f"\n{'=' * 70}")
    print(f"DRAFT REVIEW - Revision {payload['revision_number']}")
    print("=" * 70)

    print("\n## ABOUT THE COMPANY")
    print(payload["about_company"])

    print("\n## ROLE OVERVIEW")
    print(payload["role"])

    print("\n## REQUIRED SKILLS & EXPERIENCE")
    for item in payload["requirements"]:
        print(f"  • {item}")

    print("\n## NICE TO HAVE")
    for item in payload["nice_to_have"]:
        print(f"  • {item}")

    print("\n## WHAT WE OFFER")
    for item in payload["offers"]:
        print(f"  • {item}")

    user_input = input("\n>>> Type 'approved' to finish, or provide feedback: ").strip()

    # Update config with revision info for tracing
    revision_config = {
        **thread_config,
        "metadata": {
            **thread_config.get("metadata", {}),
            "revision_number": payload["revision_number"],
            "user_feedback_length": len(user_input),
        },
    }
    result = app.invoke(Command(resume=user_input), config=revision_config)

print("\n" + "=" * 70)
print("FINAL JOB DESCRIPTION")
print("=" * 70)
print(result["final_doc"])
