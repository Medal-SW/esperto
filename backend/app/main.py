from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.admin.router import router as admin_router
from app.auth.router import router as auth_router
from app.dashboard.router import router as dashboard_router
from app.exceptions import ForbiddenError, NotFoundError
from app.letroso.router import router as letroso_router
from app.ranking.router import router as ranking_router
from app.scores.router import router as scores_router

app = FastAPI(
    title="Esperto",
    version="0.1.0",
    description="Esperto — Ranking de jogos diários",
)


@app.exception_handler(NotFoundError)
async def not_found_handler(_request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": exc.detail})


@app.exception_handler(ForbiddenError)
async def forbidden_handler(_request, exc: ForbiddenError):
    return JSONResponse(status_code=403, content={"detail": exc.detail})


app.include_router(auth_router, prefix="/api")
app.include_router(scores_router, prefix="/api")
app.include_router(ranking_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(letroso_router, prefix="/api")

uploads_dir = Path("/app/uploads/avatars")
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
