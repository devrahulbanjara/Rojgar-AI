from langgraph.types import Command

from . import create_workflow


def run_auto_approved(candidates: list[dict]) -> list[dict]:
    """
    Run the workflow in auto-approved mode for multiple candidates.

    Args:
        candidates: List of dicts with 'name', 'email', 'reason' keys.

    Returns:
        List of results for each candidate.
    """
    app = create_workflow()
    results = []

    for idx, candidate in enumerate(candidates):
        config = {
            "configurable": {"thread_id": f"auto_candidate_{idx}"},
            "run_name": "interview_scheduling_workflow",
            "tags": ["interview_scheduling", "langgraph", "auto_approved"],
            "metadata": {
                "thread_id": f"auto_candidate_{idx}",
                "workflow": "interview_scheduling",
                "mode": "auto_approved",
                "candidate_name": candidate["name"],
            },
        }

        initial_state = {
            "name": candidate["name"],
            "email": candidate["email"],
            "reason": candidate["reason"],
            "draft_email": None,
            "approved": False,
            "auto_approved": True,
            "send_status": None,
        }

        result = app.invoke(initial_state, config)
        results.append(result)

        print(f"\n{'=' * 60}")
        print(f"Candidate: {result['name']} ({result['email']})")
        print(f"Approved: {result['approved']}")
        print(f"Send Status: {result['send_status']}")
        print(f"{'=' * 60}")

    return results


def run_with_approval(candidate: dict, thread_id: str = "hitl_demo") -> dict:
    """
    Run the workflow with human-in-the-loop approval.

    Args:
        candidate: Dict with 'name', 'email', 'reason' keys.
        thread_id: Unique thread identifier for the workflow.

    Returns:
        Final result after approval/rejection.
    """
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
        "name": candidate["name"],
        "email": candidate["email"],
        "reason": candidate["reason"],
        "draft_email": None,
        "approved": False,
        "auto_approved": False,
        "send_status": None,
    }

    result = app.invoke(initial_state, config)

    if "__interrupt__" in result:
        payload = result["__interrupt__"][0].value

        print(f"\n{'=' * 70}")
        print("DRAFT EMAIL REVIEW")
        print("=" * 70)
        print(f"\nCandidate: {payload['candidate_name']}")
        print(f"Email: {payload['candidate_email']}")
        print("\nReason for shortlisting:")
        print(f"  {payload['reason']}")
        print(f"\n{'=' * 70}")

        user_input = (
            input("\n>>> Type 'approve' to send, or 'reject' to cancel: ")
            .strip()
            .lower()
        )
        approved = user_input == "approve"

        # Update config with approval decision for tracing
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
    print(f"Approved: {result['approved']}")
    print(f"Send Status: {result['send_status']}")

    return result


def main():
    """Main entry point for the interview scheduling agent."""
    print("\n" + "=" * 70)
    print("INTERVIEW SCHEDULING AGENT")
    print("=" * 70)

    # Example candidates
    candidates = [
        {
            "name": "Rahul Dev Banjara",
            "email": "rdbanjara07@gmail.com",
            "reason": "This candidate has a strong FastAPI experience and strong background in building scalable backend systems, which aligns perfectly with our technical stack.",
        },
    ]

    print("\nSelect mode:")
    print("1. Auto-approved (send emails without review)")
    print("2. Human-in-the-loop (review each email before sending)")

    mode = input("\n>>> Enter 1 or 2: ").strip()

    if mode == "1":
        print("\nRunning in auto-approved mode...")
        run_auto_approved(candidates)
    elif mode == "2":
        print("\nRunning in human-in-the-loop mode...")
        for idx, candidate in enumerate(candidates):
            run_with_approval(candidate, thread_id=f"hitl_candidate_{idx}")
    else:
        print("Invalid selection. Exiting.")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
