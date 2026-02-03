from app.models.resume import Resume


class ResumeFormatter:
    @staticmethod
    def format_to_markdown(resume: Resume) -> str:
        lines = [
            f"# Resume: {resume.resume_name}",
            f"Target Role: {resume.target_job_title or 'Not Specified'}",
            f"Summary: {resume.custom_summary or 'No summary provided.'}\n",
        ]

        lines.append("## Work Experience")
        if resume.work_experiences:
            for exp in resume.work_experiences:
                status = (
                    "Present" if exp.is_current else (exp.end_date or "Not specified")
                )
                location_info = f" ({exp.location})" if exp.location else ""
                lines.append(
                    f"- **{exp.job_title}** at {exp.company}{location_info} ({exp.start_date or 'Not specified'} to {status})"
                )
                if exp.description:
                    lines.append(f"  {exp.description}")
        else:
            lines.append("No work experience listed.")

        lines.append("\n## Education")
        if resume.educations:
            for edu in resume.educations:
                location_info = f" ({edu.location})" if edu.location else ""
                graduation_info = (
                    f" (Graduated: {edu.end_date})" if edu.end_date else ""
                )
                lines.append(
                    f"- {edu.degree}, {edu.college_name}{location_info}{graduation_info}"
                )
        else:
            lines.append("No education listed.")

        lines.append("\n## Technical Skills")
        if resume.skills:
            skill_list = ", ".join([s.skill_name for s in resume.skills])
            lines.append(skill_list)
        else:
            lines.append("None listed.")

        if resume.certifications:
            lines.append("\n## Certifications")
            for cert in resume.certifications:
                expiry_info = ""
                if cert.does_not_expire:
                    expiry_info = " (Does not expire)"
                elif cert.expiration_date:
                    expiry_info = f" (Expires: {cert.expiration_date})"

                lines.append(
                    f"- {cert.certification_name} by {cert.issuing_body}{expiry_info}"
                )

        if resume.social_links:
            lines.append("\n## Social Links")
            for link in resume.social_links:
                lines.append(f"- {link.type}: {link.url}")

        return "\n".join(lines)
