from langchain_core.messages import HumanMessage, SystemMessage

from app.core.config import settings
from app.integrations.groq.provider import get_llm
from app.schemas.agents.interview_scheduling import InterviewSchedulingState

from ..templates import get_email_html_layout


async def compose_email_draft(state: InterviewSchedulingState) -> dict:
    llm = get_llm(settings.THINK_LLM)
    is_shortlisted = state["status"] == "shortlisted"
    org_name = state["org_name"]

    # 1. Identity & Voice Enforcement
    system_message = SystemMessage(
        content=f"""You are the official brand voice for {org_name}.

STRICT IDENTITY RULES:
- Use "our team" or "we". NEVER use "I", "me", or "personally"
- NEVER mention "CTO", "HR", "AI", "Evaluator", or "Manager"
- If the internal feedback mentions specific roles (e.g., "CTO liked..."), REWRITE it to "Our team was impressed by..."
- SIGNATURE: Always end exactly with: "Best regards,<br/>The {org_name} Team"

You write transparent, empathetic recruitment emails that build trust."""
    )

    # 2. Task instructions with explicit structure
    if is_shortlisted:
        prompt = f"""Write a shortlist email for {state["name"]}.

INTERNAL ASSESSMENT TO SYNTHESIZE:
"{state["feedback"]}"

STRUCTURE (follow exactly):

<p>Hi {state["name"]},</p>

<p>Our team has reviewed your application and we're excited to move forward with you for the position.</p>

<p><strong>Why we're moving forward:</strong> [Extract 2-3 specific technical strengths from the feedback. Be genuine and specific. If feedback mentions "CTO" or "HR", rewrite as "our team"]</p>

<p><strong>Next Step:</strong> We'd love to schedule a technical interview to dive deeper into your background. Please use the link below to book a time that works for you:</p>

<p><a href="{settings.BOOKING_LINK}" style="color: #2563eb; text-decoration: none;">Click here to book your interview</a></p>

<p>Looking forward to our conversation!</p>

<p>Best regards,<br/>The {org_name} Team</p>

CRITICAL RULES:
❌ NEVER copy "CTO", "HR", "AI" from feedback - sanitize to "our team"
❌ NEVER use "[Your Name]" or placeholders
✅ Extract SPECIFIC technologies, skills, experiences from feedback
✅ End with exactly: "Best regards,<br/>The {org_name} Team"

Return ONLY the HTML paragraphs."""
    else:
        prompt = f"""Write a rejection email with transparent feedback for {state["name"]}.

INTERNAL ASSESSMENT TO SYNTHESIZE:
"{state["feedback"]}"

STRUCTURE (follow exactly):

<p>Dear {state["name"]},</p>

<p>Thank you for the time and energy you invested in your application. After careful review, our team has decided to move forward with other candidates at this time.</p>

<p><strong>Team Feedback:</strong></p>

<p><strong>What we loved:</strong> [Extract 1-2 genuine strengths from the feedback. Be specific about skills or experiences. If feedback mentions "CTO" or "HR", rewrite as "our team"]</p>

<p><strong>Where we're looking for more:</strong> [Explain the gap objectively and constructively. What specific experience or depth we need for this role. Sanitize any "CTO/HR" mentions]</p>

<p><strong>A Note of Hope:</strong> This decision is specific to our current role requirements and doesn't diminish your talent. Your skills in [mention specific skill from feedback] will make you a valuable asset to the right team. We encourage you to keep an eye on future opportunities that might be a better fit.</p>

<p>We wish you the very best in your search.</p>

<p>Best regards,<br/>The {org_name} Team</p>

CRITICAL RULES:
❌ NEVER copy "CTO", "HR", "AI", "Manager" from feedback - sanitize to "our team" or "we"
❌ NEVER use "[Your Name]" or placeholders
❌ NEVER use "I" or "personally"
✅ Be specific and constructive
✅ End with exactly: "Best regards,<br/>The {org_name} Team"

Return ONLY the HTML paragraphs."""

    response = await llm.ainvoke([system_message, HumanMessage(content=prompt)])

    # Wrap in layout
    html_body = get_email_html_layout(
        content=response.content,
        is_shortlisted=is_shortlisted,
        org_name=org_name,
    )

    if is_shortlisted:
        subject = f"Next Steps: Your application at {org_name}"
    else:
        subject = f"Update on your application at {org_name}"

    return {"draft_email_html": html_body, "subject": subject}
