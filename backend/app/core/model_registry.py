"""Import all SQLAlchemy models so Base.metadata is fully populated."""

import app.modules.activity.models
import app.modules.admin.guards
import app.modules.admin.models
import app.modules.applications.models
import app.modules.assistant.models
import app.modules.audit.models
import app.modules.audit.service
import app.modules.auth.models
import app.modules.companies.models
import app.modules.entitlements.models
import app.modules.interviews.models
import app.modules.jobs.models
import app.modules.notifications.models
import app.modules.public.models
import app.modules.recruiter_preferences.models
import app.modules.resumes.models  # noqa: F401
