import uuid
from typing import cast
from langgraph.types import Command
from app.models.agents.jd_generator import JobState
from . import app, reference_jd

print("--- LangGraph Persistence Test ---")
print("1. Start Fresh (New ID)")
print("2. Continue (Persistent ID)")
choice = input("Select an option (1/2): ").strip()

if choice == "1":
    thread_id = f"test-{uuid.uuid4().hex[:6]}"
    print(f"Starting NEW session: {thread_id}")
else:
    thread_id = "persistence-demo-thread"
    print(f"Resuming session: {thread_id}")

thread_config = {
    "configurable": {"thread_id": thread_id},
    "run_name": "jd_generation_workflow",
}

initial_state = cast(
    JobState,
    {
        "requirements": r"Senior Machine Learning Engineer, 4+ years experience, interest in teaching and mentoring students, 50% engineering work, 50% training students for AWS Certified MLA-C01",
        "format_reference": reference_jd,
        "revision_count": 0,
    },
)

current_state = app.get_state(thread_config)

if not current_state.next:
    app.invoke(initial_state, config=thread_config)
else:
    print("Found existing state! Resuming...")

while True:
    state_snapshot = app.get_state(thread_config)

    if not state_snapshot.next:
        if "final_doc" in state_snapshot.values:
            print("\n" + "=" * 70)
            print("FINAL JOB DESCRIPTION")
            print("=" * 70)
            print(state_snapshot.values["final_doc"])
        break

    if state_snapshot.tasks and state_snapshot.tasks[0].interrupts:
        payload = state_snapshot.tasks[0].interrupts[0].value

        print(f"\n{'=' * 70}")
        print(
            f"DRAFT REVIEW - Revision {state_snapshot.values.get('revision_count', 0)}"
        )
        print("=" * 70)

        print(f"\n## ABOUT THE COMPANY\n{payload.get('about_company', '')}")
        print(f"\n## ROLE OVERVIEW\n{payload.get('role', '')}")

        print("\n## REQUIRED SKILLS & EXPERIENCE")
        for item in payload.get("requirements", []):
            print(f"  • {item}")

        print("\n## WHAT WE OFFER")
        for item in payload.get("offers", []):
            print(f"  • {item}")

        user_input = input("\n>>> Type 'approved' or provide feedback: ").strip()
        app.invoke(Command(resume=user_input), config=thread_config)
    else:
        break
