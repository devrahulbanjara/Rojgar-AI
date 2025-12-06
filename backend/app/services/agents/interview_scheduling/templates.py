"""
Email templates for interview scheduling agent.
"""


def get_interview_email_template(
    name: str,
    reason: str,
    booking_link: str,
    contact_email: str,
) -> str:
    """
    Generate HTML email template for interview scheduling.

    Args:
        name: Candidate's name.
        reason: Reason for shortlisting.
        booking_link: Calendar booking link.
        contact_email: Contact email for replies.

    Returns:
        HTML email content as string.
    """
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; color: #1a202c; padding: 0; margin: 0; background-color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">

        <!-- Main Content -->
        <div style="padding: 48px 32px;">

            <!-- Title -->
            <h1 style="color: #1a202c; margin: 0 0 24px 0; font-size: 32px; font-weight: 600; line-height: 1.2;">
                Congratulations, {name}!
            </h1>

            <!-- Body Text -->
            <p style="font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; color: #4a5568;">
                We're pleased to inform you that you've been shortlisted for an interview.
                Your application stood out to our team.
            </p>

            <!-- Reason Highlight -->
            <div style="background: #f7fafc; padding: 20px 24px; margin: 32px 0; border-radius: 8px; border-left: 3px solid #5b5fff;">
                <p style="font-size: 15px; line-height: 1.7; margin: 0; color: #2d3748;">
                    {reason}
                </p>
            </div>

            <p style="font-size: 16px; line-height: 1.7; margin: 24px 0 32px 0; color: #4a5568;">
                Please schedule your interview at a time that works best for you.
            </p>

            <!-- Important Notice -->
            <div style="background: #fff5f5; padding: 16px 20px; margin: 32px 0; border-radius: 8px; border-left: 4px solid #e53e3e;">
                <p style="font-size: 14px; line-height: 1.6; margin: 0; color: #c53030;">
                    <strong style="color: #e53e3e;">⚠️ Important:</strong> Please use the same email address you provided in your CV when booking the interview. This ensures we can match your booking to your application.
                </p>
            </div>

            <!-- CTA Button -->
            <div style="margin: 40px 0;">
                <a href="{booking_link}"
                   style="display: inline-block; background: #5b5fff;
                          color: #ffffff; text-decoration: none; padding: 16px 32px;
                          border-radius: 8px; font-size: 16px; font-weight: 500;
                          transition: background 0.2s;">
                    Schedule Interview
                </a>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #718096; margin: 32px 0 0 0;">
                Questions? Feel free to reply to this email.
            </p>
        </div>

        <!-- Footer -->
        <div style="padding: 32px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #a0aec0; margin: 0; line-height: 1.6;">
                The ConvexHire Team<br>
                <a href="mailto:{contact_email}" style="color: #5b5fff; text-decoration: none;">{contact_email}</a>
            </p>
        </div>

    </div>
</body>
</html>"""
