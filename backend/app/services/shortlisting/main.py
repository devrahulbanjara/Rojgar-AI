from workflow import create_workflow
from utils import print_report


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("ConvexHire Candidate Shortlisting Agent")
    print("=" * 60 + "\n")

    app = create_workflow()

    inputs = {
        "job_description_path": "job_description.txt",
        "resume_file_paths": [
            "resumes/candidate_aashish.txt",
            "resumes/candidate_sampada.txt",
        ],
    }

    result = app.invoke(inputs)

    print_report(result["final_report"])
