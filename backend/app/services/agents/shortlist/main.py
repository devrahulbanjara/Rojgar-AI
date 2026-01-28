from dotenv import load_dotenv
from langgraph.checkpoint.memory import MemorySaver

from .graph import create_workflow

load_dotenv()

checkpointer = MemorySaver()

builder = create_workflow()
app = builder.compile(checkpointer=checkpointer)


if __name__ == "__main__":
    inputs = {
        "jd": "Senior AI Engineer. Requirements: 5+ years exp, LangGraph, AWS Bedrock, and experience with 'NicheFrameworkX'.",
        "resume": "John Doe. 6 years experience. Expert in AWS. Worked at 'UnknownStartup Inc' building agents with NicheFrameworkX.",
        "max_iterations": 2,
        "iteration": 0,
        "cto_evals": [],
        "hr_evals": [],
        "critiques": [],
        "is_satisfied": False,
    }

    config = {"configurable": {"thread_id": "agentic_reflection_v1"}}

    for output in app.stream(inputs, config=config):
        print(output)

    final_state = app.get_state(config).values
    print(f"SCORE: {final_state.get('final_score')}/100")
    print(f"REASON: {final_state.get('final_reason')}")
