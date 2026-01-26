from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded


class ConvexHireError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class BusinessLogicError(ConvexHireError):
    pass


class NotFoundError(ConvexHireError):
    pass


class UnauthorizedError(ConvexHireError):
    pass


class ForbiddenError(ConvexHireError):
    pass


class ConflictError(ConvexHireError):
    pass


def setup_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(status_code=429, content={"detail": "Too many requests"})

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return JSONResponse(status_code=404, content={"detail": exc.message})

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError):
        return JSONResponse(status_code=401, content={"detail": exc.message})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError):
        return JSONResponse(status_code=403, content={"detail": exc.message})

    @app.exception_handler(BusinessLogicError)
    async def business_logic_handler(request: Request, exc: BusinessLogicError):
        return JSONResponse(status_code=400, content={"detail": exc.message})

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError):
        return JSONResponse(status_code=409, content={"detail": exc.message})
