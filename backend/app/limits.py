from fastapi import HTTPException
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

TOO_LARGE = 'The upload is too large.'


class BodySizeLimit:
    """Reject request bodies over a limit while they arrive, before more than the limit is stored.

    The declared Content-Length is checked first, but a client can lie or leave it out,
    so the bytes are also counted as they stream in.
    """

    def __init__(self, app: ASGIApp, max_bytes: int) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        declared = dict(scope['headers']).get(b'content-length')
        if declared is not None and not declared.isdigit():
            await JSONResponse({'detail': 'Invalid Content-Length header.'}, status_code=400)(scope, receive, send)
            return
        if declared is not None and int(declared) > self.max_bytes:
            await JSONResponse({'detail': TOO_LARGE}, status_code=413)(scope, receive, send)
            return

        received = 0

        async def counting_receive() -> Message:
            nonlocal received
            message = await receive()
            if message['type'] == 'http.request':
                received += len(message.get('body', b''))
                if received > self.max_bytes:
                    raise HTTPException(status_code=413, detail=TOO_LARGE)
            return message

        await self.app(scope, counting_receive, send)
