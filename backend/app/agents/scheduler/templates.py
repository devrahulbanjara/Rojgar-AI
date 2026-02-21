from app.core.config import settings


def get_email_html_layout(content: str, is_shortlisted: bool, org_name: str) -> str:
    logo_url = settings.LOGO_URL

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; color: #1f2937; line-height: 1.6; margin: 0; padding: 0; background-color: #f3f4f6;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 40px 20px 40px;">
                            <img src="{logo_url}" alt="{org_name}" width="180" style="display: block; border: 0;">
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 10px 40px 40px 40px; font-size: 15px; color: #374151;">
                            <div style="border-top: 1px solid #f3f4f6; padding-top: 25px;">
                                {content}
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px; font-size: 12px; color: #9ca3af; text-align: center;">
                            <p style="margin: 0;">Sent via <strong>ConvexHire AI</strong> on behalf of <strong>{org_name}</strong></p>
                            <p style="margin: 5px 0 0 0;">© 2026 ConvexHire. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>"""
