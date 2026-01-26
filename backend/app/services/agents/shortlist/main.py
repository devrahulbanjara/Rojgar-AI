from backend.app.services.agents.shortlist.graph import app

RESUME_PATH = "devrahulbanjara_resume.pdf"

sample_jd = """Associate Machine Learning Engineer
- Build and deploy ML/LLM-powered systems using Python, FastAPI, and modern ML frameworks.
- Design RAG and agentic workflows leveraging LangChain/LangGraph and vector databases.
- Implement end-to-end MLOps pipelines on AWS (training, deployment, monitoring, CI/CD).
- Collaborate on production-grade AI solutions with a strong focus on scalability and reliability.
- Have a AWS Certification focused on ML"""


inputs = {"resume_path": RESUME_PATH, "jd_text": sample_jd, "max_iterations": 2}

try:
    final_state = app.invoke(inputs)

    report = final_state.get("final_report")
    if report:
        print("\n" + "=" * 80)
        print("FINAL SHORTLISTING REPORT")
        print("=" * 80)
        print(f"\nDECISION: {report.decision}")
        print(f"FINAL SCORE: {report.final_score}/10")
        print("\nScore Breakdown:")
        for component, score in report.score_breakdown.items():
            print(f"  • {component}: {score}")
        print("\nKey Strengths:")
        for strength in report.key_strengths:
            print(f"  ✓ {strength}")
        print("\nKey Concerns:")
        for concern in report.key_concerns:
            print(f"  ✗ {concern}")
        print(f"\nJustification:\n{report.justification}")
        print(f"\nRecommendation:\n{report.recommendation}")
        print("=" * 80)


except Exception as e:
    print(f"Error: {e}")
