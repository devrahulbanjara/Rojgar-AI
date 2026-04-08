"""Import all SQLAlchemy models so Base.metadata is fully populated."""

import app.modules.applications.models  # noqa: F401
import app.modules.activity.models  # noqa: F401
import app.modules.audit.models  # noqa: F401
import app.modules.audit.service  # noqa: F401
import app.modules.auth.models  # noqa: F401
import app.modules.companies.models  # noqa: F401
import app.modules.interviews.evaluation_models  # noqa: F401
import app.modules.interviews.models  # noqa: F401
import app.modules.interviews.recording_model  # noqa: F401
import app.modules.job_ai.models  # noqa: F401
import app.modules.jobs.models  # noqa: F401
import app.modules.notifications.models  # noqa: F401
import app.modules.outreach.models  # noqa: F401
import app.modules.profiles.models  # noqa: F401
import app.modules.recruiter_chat.models  # noqa: F401
import app.modules.recruiter_preferences.models  # noqa: F401
import app.modules.resumes.models  # noqa: F401
