from app.models import ReferenceJobDescriptions


class ReferenceJDFormatter:
    @staticmethod
    def format_reference_jd(
        reference_jd: ReferenceJobDescriptions, about_the_company: str | None = None
    ) -> str:
        formatted_lines = []
        if reference_jd.department:
            formatted_lines.append(f"Department: {reference_jd.department}")
        if about_the_company:
            formatted_lines.append(f"\nAbout the Company:\n{about_the_company}")
        formatted_lines.append(f"\nJob Summary:\n{reference_jd.job_summary}")
        if reference_jd.job_responsibilities:
            formatted_lines.append("\nJob Responsibilities:")
            for responsibility in reference_jd.job_responsibilities:
                formatted_lines.append(f"- {responsibility}")
        if reference_jd.required_qualifications:
            formatted_lines.append("\nRequired Qualifications:")
            for qualification in reference_jd.required_qualifications:
                formatted_lines.append(f"- {qualification}")
        if reference_jd.preferred:
            formatted_lines.append("\nPreferred Skills:")
            for preferred in reference_jd.preferred:
                formatted_lines.append(f"- {preferred}")
        if reference_jd.compensation_and_benefits:
            formatted_lines.append("\nCompensation and Benefits:")
            for benefit in reference_jd.compensation_and_benefits:
                formatted_lines.append(f"- {benefit}")
        return "\n".join(formatted_lines)
