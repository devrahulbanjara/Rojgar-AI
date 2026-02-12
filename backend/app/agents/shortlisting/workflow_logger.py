import uuid
from datetime import datetime
from pathlib import Path


class WorkflowLogger:
    """Logs workflow execution to a file."""

    def __init__(self, job_id: uuid.UUID, application_id: uuid.UUID):
        self.job_id = job_id
        self.application_id = application_id
        self.logs_dir = Path("logs/shortlisting")
        self.logs_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = self.logs_dir / f"{job_id}_{application_id}_{timestamp}.log"
        self._write("=== Shortlisting Workflow Started ===")
        self._write(f"Job ID: {job_id}")
        self._write(f"Application ID: {application_id}")
        self._write(f"Timestamp: {datetime.now().isoformat()}")
        self._write("=" * 50)

    def _write(self, message: str) -> None:
        """Write a line to the log file."""
        timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        with open(self.log_file, "a") as f:
            f.write(f"[{timestamp}] {message}\n")

    def log_node_start(self, node_name: str) -> None:
        """Log when a node starts execution."""
        self._write(f">> NODE START: {node_name}")

    def log_node_end(self, node_name: str, output: str | None = None) -> None:
        """Log when a node completes execution."""
        self._write(f"<< NODE END: {node_name}")
        if output:
            self._write(f"   Output: {output[:500]}...")

    def log_event(self, event: str, details: str | None = None) -> None:
        """Log a general event."""
        self._write(f"-- {event}")
        if details:
            self._write(f"   {details}")

    def log_error(self, error: str) -> None:
        """Log an error."""
        self._write(f"!! ERROR: {error}")

    def log_result(self, score: int, reason: str) -> None:
        """Log the final result."""
        self._write("=" * 50)
        self._write("=== FINAL RESULT ===")
        self._write(f"Score: {score}/100")
        self._write(f"Reason: {reason}")
        self._write(f"Completed: {datetime.now().isoformat()}")
        self._write("=" * 50)

    def get_log_path(self) -> str:
        """Return the path to the log file."""
        return str(self.log_file)
