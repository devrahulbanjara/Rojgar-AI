import asyncio

from langgraph.types import Command

from app.core.logging_config import logger

from .graph import create_workflow


async def process_email_batch(
    candidates: list[dict], org_name: str, auto_approve: bool = False
) -> list[dict]:
    app = create_workflow()
    results = []

    for candidate in candidates:
        try:
            config = {
                "configurable": {"thread_id": f"email_{candidate['application_id']}"}
            }

            initial_state = {
                "application_id": candidate["application_id"],
                "name": candidate["name"],
                "email": candidate["email"],
                "org_name": org_name,  # Pass organization name
                "status": candidate["status"],
                "score": candidate["score"],
                "feedback": candidate["feedback"],
                "auto_approved": auto_approve,
                "retry_count": 0,
            }

            logger.info(f"Processing email for {candidate['name']}...")

            result = await app.ainvoke(initial_state, config)
            results.append(result)

            await asyncio.sleep(1.5)

        except Exception as e:
            logger.error(f"Failed to process {candidate['email']}: {e}")

    return results


def run_auto_approved(candidates: list[dict], org_name: str = "Our Team") -> list[dict]:
    app = create_workflow()
    results = []

    for candidate in candidates:
        config = {
            "configurable": {"thread_id": f"auto_{candidate['application_id']}"},
            "run_name": "interview_scheduling_workflow",
            "tags": ["interview_scheduling", "langgraph", "auto_approved"],
            "metadata": {
                "thread_id": f"auto_{candidate['application_id']}",
                "workflow": "interview_scheduling",
                "mode": "auto_approved",
                "candidate_name": candidate["name"],
            },
        }

        initial_state = {
            "application_id": candidate["application_id"],
            "name": candidate["name"],
            "email": candidate["email"],
            "org_name": org_name,  # Pass organization name
            "status": candidate["status"],
            "score": candidate["score"],
            "feedback": candidate["feedback"],
            "subject": None,
            "draft_email_html": None,
            "approved": False,
            "auto_approved": True,
            "send_status": None,
            "retry_count": 0,
        }

        result = app.invoke(initial_state, config)
        results.append(result)

        print(f"\n{'=' * 60}")
        print(f"Candidate: {result['name']} ({result['email']})")
        print(f"Status: {result['status']}")
        print(f"Score: {result['score']}/100")
        print(f"Approved: {result['approved']}")
        print(f"Send Status: {result['send_status']}")
        print(f"{'=' * 60}")

    return results


def run_with_approval(
    candidate: dict, org_name: str = "Our Team", thread_id: str = "hitl_demo"
) -> dict:

    app = create_workflow()

    config = {
        "configurable": {"thread_id": thread_id},
        "run_name": "interview_scheduling_workflow",
        "tags": ["interview_scheduling", "langgraph", "hitl"],
        "metadata": {
            "thread_id": thread_id,
            "workflow": "interview_scheduling",
            "mode": "hitl",
            "candidate_name": candidate["name"],
        },
    }

    initial_state = {
        "application_id": candidate["application_id"],
        "name": candidate["name"],
        "email": candidate["email"],
        "org_name": org_name,  # Pass organization name
        "status": candidate["status"],
        "score": candidate["score"],
        "feedback": candidate["feedback"],
        "subject": None,
        "draft_email_html": None,
        "approved": False,
        "auto_approved": False,
        "send_status": None,
        "retry_count": 0,
    }

    result = app.invoke(initial_state, config)

    if "__interrupt__" in result:
        payload = result["__interrupt__"][0].value

        print(f"\n{'=' * 70}")
        print("DRAFT EMAIL REVIEW")
        print("=" * 70)
        print(f"\nCandidate: {payload['candidate_name']}")
        print(f"Email: {payload['candidate_email']}")
        print(f"Status: {payload['status']}")
        print(f"Score: {payload['score']}/100")
        print("\nAI Feedback:")
        print(f"  {payload['feedback']}")
        print(f"\nSubject: {payload['subject']}")
        print(f"\n{'=' * 70}")

        user_input = (
            input("\n>>> Type 'approve' to send, or 'reject' to cancel: ")
            .strip()
            .lower()
        )

        approved = user_input == "approve"

        revision_config = {
            **config,
            "metadata": {
                **config.get("metadata", {}),
                "user_decision": "approve" if approved else "reject",
            },
        }

        result = app.invoke(Command(resume=approved), config=revision_config)

    print(f"\n{'=' * 60}")
    print("FINAL RESULT")
    print("=" * 60)
    print(f"Candidate: {result['name']} ({result['email']})")
    print(f"Status: {result['status']}")
    print(f"Score: {result['score']}/100")
    print(f"Approved: {result['approved']}")
    print(f"Send Status: {result['send_status']}")

    return result


def main():
    print("\n" + "=" * 70)
    print("INTERVIEW SCHEDULING AGENT - 2026 Edition")
    print("=" * 70)

    candidates = [
        {
            "application_id": "app_001",
            "name": "Rahul Dev Banjara",
            "email": "rdbanjara07@gmail.com",
            "status": "shortlisted",
            "score": 92,
            "feedback": "Strong FastAPI experience and excellent background in building scalable backend systems. Demonstrated deep understanding of async patterns and microservices architecture.",
        }
    ]

    print("\nSelect mode:")
    print("1. Auto-approved (send emails without review)")
    print("2. Human-in-the-loop (review each email before sending)")

    mode = input("\n>>> Enter 1 or 2: ").strip()

    if mode == "1":
        print("\nRunning in auto-approved mode...")
        run_auto_approved(candidates, org_name="ConvexHire")
    elif mode == "2":
        print("\nRunning in human-in-the-loop mode...")
        for _, candidate in enumerate(candidates):
            run_with_approval(
                candidate,
                org_name="ConvexHire",
                thread_id=f"hitl_{candidate['application_id']}",
            )
    else:
        print("Invalid selection. Exiting.")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
