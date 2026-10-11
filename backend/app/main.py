from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.limits import BodySizeLimit
from app.routes import router

settings = get_settings()

app = FastAPI(title='Lucy API', version='0.1.0')
app.include_router(router)

# The middleware added last runs first. CORS goes outermost so that even a 413 from
# the size limit carries CORS headers, and the browser can show the real error.
app.add_middleware(BodySizeLimit, max_bytes=settings.max_request_mb * 1024 * 1024)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_methods=['GET', 'POST'],
    allow_headers=['Content-Type'],
)
