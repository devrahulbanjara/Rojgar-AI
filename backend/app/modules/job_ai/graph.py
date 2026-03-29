from typing import Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt

from app.infrastructures.ai.service import ai_service
from app.modules.job_ai.prompts import (
    JOB_DRAFT_SYSTEM_PROMPT,
    REFINE_DRAFT_SYSTEM_PROMPT,
    SALARY_SYNTHESIS_SYSTEM_PROMPT,
)
from app.modules.job_ai.schemas import JobDraft, SalaryResearch
from app.modules.job_ai.validators import validate_job_draft


class JobAgentState(TypedDict):
    draft_db_id: str
    thread_id: str
    recruiter_id: str
    company_id: str
    mode: Literal["create", "improve", "clone"]

    prompt: str | None
    source_text: str | None
    source_job: dict[str, Any] | None
    company_context: dict[str, Any] | None

    research_salary: bool
    salary_role: str | None
    salary_country: str | None
    salary_research_input: dict[str, Any] | None
    salary_research: dict[str, Any] | None

    locked_fields: list[str]
    draft: dict[str, Any] | None
    assumptions: list[str]
    warnings: list[str]
    missing_fields: list[str]
    validation_errors: list[str]
    human_decision: dict[str, Any] | None


def build_job_ai_graph():
    async def synthesize_salary_node(state: JobAgentState) -> dict[str, Any]:
        if not state["research_salary"] or not state["salary_research_input"]:
            return {"salary_research": None}

        salary_research = await ai_service.generate_structured(
            system_prompt=SALARY_SYNTHESIS_SYSTEM_PROMPT,
            user_payload=state["salary_research_input"],
            schema_model=SalaryResearch,
        )

        return {"salary_research": salary_research.model_dump(mode="json")}

    async def generate_draft_node(state: JobAgentState) -> dict[str, Any]:
        payload = {
            "mode": state["mode"],
            "prompt": state["prompt"],
            "source_text": state["source_text"],
            "source_job": state["source_job"],
            "company_context": state["company_context"],
            "company_default_location": (
                state["company_context"]["company"].get("location")
                if state["company_context"]
                else None
            ),
            "salary_research": state["salary_research"],
            "locked_fields": state["locked_fields"],
            "allowed_location_types": state["company_context"][
                "allowed_location_types"
            ],
            "default_status": state["company_context"]["default_status"],
        }

        draft = await ai_service.generate_structured(
            system_prompt=JOB_DRAFT_SYSTEM_PROMPT,
            user_payload=payload,
            schema_model=JobDraft,
        )

        return {
            "draft": draft.model_dump(mode="json"),
            "assumptions": draft.assumptions,
            "warnings": draft.warnings,
            "missing_fields": draft.missing_fields,
        }

    async def validate_draft_node(state: JobAgentState) -> dict[str, Any]:
        draft = JobDraft.model_validate(state["draft"])
        errors = validate_job_draft(draft)
        return {"validation_errors": errors}

    async def review_node(state: JobAgentState) -> dict[str, Any]:
        interrupt_payload = {
            "type": "job_draft_review",
            "draft_db_id": state["draft_db_id"],
            "draft": state["draft"],
            "salary_research": state["salary_research"],
            "assumptions": state["assumptions"],
            "warnings": state["warnings"],
            "missing_fields": state["missing_fields"],
            "validation_errors": state["validation_errors"],
            "locked_fields": state["locked_fields"],
        }

        decision = interrupt(interrupt_payload)
        return {"human_decision": decision}

    async def refine_node(state: JobAgentState) -> dict[str, Any]:
        decision = state["human_decision"] or {}
        current_draft = state["draft"] or {}

        edited_fields = decision.get("edited_fields") or {}
        regenerate_fields = set(decision.get("regenerate_fields") or [])
        feedback = decision.get("feedback")

        locked_fields = set(decision.get("locked_fields") or state["locked_fields"])
        merged = {**current_draft, **edited_fields}

        fields_allowed_to_change = sorted(list(regenerate_fields - locked_fields))

        payload = {
            "current_draft": merged,
            "feedback": feedback,
            "fields_allowed_to_change": fields_allowed_to_change,
            "locked_fields": sorted(list(locked_fields)),
            "company_context": state["company_context"],
            "salary_research": state["salary_research"],
        }

        refined = await ai_service.generate_structured(
            system_prompt=REFINE_DRAFT_SYSTEM_PROMPT,
            user_payload=payload,
            schema_model=JobDraft,
        )

        return {
            "draft": refined.model_dump(mode="json"),
            "assumptions": refined.assumptions,
            "warnings": refined.warnings,
            "missing_fields": refined.missing_fields,
            "validation_errors": [],
            "human_decision": None,
            "locked_fields": sorted(list(locked_fields)),
        }

    def route_after_review(state: JobAgentState) -> str:
        decision = state["human_decision"] or {}
        action = decision.get("action")
        if action == "approve":
            return "approved"
        if action in {"edit", "regenerate"}:
            return "refine"
        if action in {"reject", "save_draft"}:
            return "end"
        return "end"

    builder = StateGraph(JobAgentState)

    builder.add_node("synthesize_salary", synthesize_salary_node)
    builder.add_node("generate_draft", generate_draft_node)
    builder.add_node("validate_draft", validate_draft_node)
    builder.add_node("review", review_node)
    builder.add_node("refine", refine_node)

    builder.add_edge(START, "synthesize_salary")
    builder.add_edge("synthesize_salary", "generate_draft")
    builder.add_edge("generate_draft", "validate_draft")
    builder.add_edge("validate_draft", "review")

    builder.add_conditional_edges(
        "review",
        route_after_review,
        {
            "approved": END,
            "refine": "refine",
            "end": END,
        },
    )
    builder.add_edge("refine", "validate_draft")

    return builder
