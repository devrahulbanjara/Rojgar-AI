from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from app.core.config import settings
from app.modules.job_ai.graph import build_job_ai_graph


class JobAIRuntime:
    def __init__(self) -> None:
        self._checkpointer_cm = None
        self.checkpointer = None
        self.graph = None

    async def start(self) -> None:
        self._checkpointer_cm = AsyncPostgresSaver.from_conn_string(
            settings.langgraph_postgres_dsn
        )
        self.checkpointer = await self._checkpointer_cm.__aenter__()

        if settings.environment != "prod":
            await self.checkpointer.setup()

        self.graph = build_job_ai_graph().compile(checkpointer=self.checkpointer)

    async def stop(self) -> None:
        if self._checkpointer_cm is not None:
            await self._checkpointer_cm.__aexit__(None, None, None)
            self._checkpointer_cm = None
            self.checkpointer = None
            self.graph = None

    def get_graph(self):
        if self.graph is None:
            raise RuntimeError("Job AI runtime not initialized")
        return self.graph


job_ai_runtime = JobAIRuntime()
