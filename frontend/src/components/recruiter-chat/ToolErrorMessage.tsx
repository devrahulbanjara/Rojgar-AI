export function ToolErrorMessage({ text }: { text: string }) {
  return (
    <div className="recruiter-chat-tool-error">
      {text || 'Something went wrong with that request.'}
    </div>
  )
}
