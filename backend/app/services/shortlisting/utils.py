def print_report(report):
    print("\n" + "=" * 60)
    print("SHORTLISTING REPORT")
    print("=" * 60 + "\n")

    print(f"SHORTLISTED ({len(report['shortlisted_candidates'])} candidates):\n")
    for i, c in enumerate(report["shortlisted_candidates"], 1):
        print(f"{i}. {c['name']} ({c['source_file']})")
        print(f"   Final Score: {c['final_score']}/10")
        print(
            f"   - Experience: {c['experience_score']}/10 ({c['breakdown']['years_experience']} years)"
        )
        print(
            f"   - Qualification: {c['qualification_score']}/10 ({c['breakdown']['qualification']})"
        )
        print(
            f"   - Skills: {c['skills_score']}/10 (matched {len(c['breakdown']['matched_skills'])}/{c['breakdown']['total_required_skills']})"
        )
        if c["breakdown"]["matched_skills"]:
            print(f"     Matched: {', '.join(c['breakdown']['matched_skills'])}")
        print()

    print(f"REJECTED ({len(report['rejected_candidates'])} candidates):\n")
    for i, c in enumerate(report["rejected_candidates"], 1):
        print(f"{i}. {c['name']} ({c['source_file']})")
        print(f"   Final Score: {c['final_score']}/10")
        print()

    print("=" * 60)
    print("Full report saved to: shortlist_report.json")
    print("=" * 60 + "\n")
