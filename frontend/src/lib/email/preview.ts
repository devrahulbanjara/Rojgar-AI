export function buildEmailPreviewDocument(subject: string, body: string) {
  let previewBody = body?.trim()
    ? body
    : '<p style="margin:0;color:#64748b;font-family:Arial,sans-serif;">No email body yet.</p>'

  // Convert plain text line breaks to HTML <br> tags if body doesn't contain HTML tags
  if (previewBody && !previewBody.includes('<') && !previewBody.includes('>')) {
    previewBody = previewBody.replace(/\n/g, '<br />')
  }

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Email preview</title>
      </head>
      <body style="margin:0;background:#f3f4f6;padding:24px;font-family:Arial,sans-serif;color:#0f172a;">
        <div style="max-width:720px;margin:0 auto;">
          <div style="margin-bottom:14px;padding:10px 14px;border:1px solid #dbe3ef;border-radius:14px;background:#ffffff;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Subject</div>
            <div style="margin-top:6px;font-size:16px;font-weight:600;color:#0f172a;">
              ${subject?.trim() || 'No subject yet'}
            </div>
          </div>
          <div style="padding:24px;border:1px solid #dbe3ef;border-radius:18px;background:#ffffff;box-shadow:0 10px 30px rgba(15,23,42,0.06);overflow:hidden;">
            ${previewBody}
          </div>
        </div>
      </body>
    </html>
  `
}
