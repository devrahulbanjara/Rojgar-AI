from app.models import ReferenceJobDescriptions


class ReferenceJDFormatter:
    @staticmethod
    def format_reference_jd(
        reference_jd: ReferenceJobDescriptions, about_the_company: str | None = None
    ) -> str:
        """
        Convert a ReferenceJobDescriptions model to a formatted string
        that can be used as a reference for the JD generator agent.
        """
        formatted_lines = []

        # Department
        if reference_jd.department:
            formatted_lines.append(f"Department: {reference_jd.department}")

        # About the Company (if available)
        if about_the_company:
            formatted_lines.append(f"\nAbout the Company:\n{about_the_company}")

        # Role Overview
        formatted_lines.append(f"\nRole Overview:\n{reference_jd.role_overview}")

        # Required Skills & Experience
        if reference_jd.required_skills_experience:
            formatted_lines.append("\nRequired Skills & Experience:")
            for skill in reference_jd.required_skills_experience:
                formatted_lines.append(f"- {skill}")

        # Nice to Have
        if reference_jd.nice_to_have:
            formatted_lines.append("\nNice to Have:")
            for item in reference_jd.nice_to_have:
                formatted_lines.append(f"- {item}")

        # What We Offer (Benefits)
        if reference_jd.offers:
            formatted_lines.append("\nWhat We Offer:")
            for offer in reference_jd.offers:
                formatted_lines.append(f"- {offer}")

        return "\n".join(formatted_lines)
