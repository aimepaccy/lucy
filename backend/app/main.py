import asyncio
import logging
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import jobs
from app.config import get_settings
from app.limits import BodySizeLimit
from app.reading import web, youtube
from app.routes import router

logging.basicConfig(level=logging.INFO, format='%(levelname)s:     %(name)s: %(message)s')
# The web client logs every address it calls, query string included, and an NCBI key travels in the
# query string. Only its warnings are kept, so a key never reaches the server's logs.
logging.getLogger('httpx2').setLevel(logging.WARNING)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uploads left by a crash or a restart in the middle of a job are deleted before any new work.
    jobs.sweep_folders()
    # The YouTube catalogue loads and refreshes in the background, so start-up does not wait for it.
    refresher = asyncio.create_task(youtube.keep_fresh())
    yield
    refresher.cancel()
    with suppress(asyncio.CancelledError):
        await refresher
    await web.close()


app = FastAPI(title='Lucy API', version='0.1.0', lifespan=lifespan)
app.include_router(router)

# The middleware added last runs first. CORS goes outermost so that even a 413 from
# the size limit carries CORS headers, and the browser can show the real error.
# Study pack requests are text only: 2 MB is far more than fits in one pack.
app.add_middleware(
    BodySizeLimit,
    max_bytes=settings.max_request_mb * 1024 * 1024,
    path_limits={'/api/packs': 2 * 1024 * 1024},
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_methods=['GET', 'POST'],
    allow_headers=['Content-Type'],
)
