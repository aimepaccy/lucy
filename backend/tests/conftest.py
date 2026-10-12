import os

# Tests use fixed settings, whatever is in the developer's own .env.
os.environ['ALLOWED_ORIGINS'] = 'http://localhost:5173'
os.environ['MAX_REQUEST_MB'] = '160'
