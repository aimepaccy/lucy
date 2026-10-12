"""Claude Code hook: after a back-end Python file is edited, run the back-end tests.

Silent when the tests pass. When they fail, exit code 2 sends the output back to Claude.
"""

import json
import os
import subprocess
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[2] / 'backend'
# Windows keeps the environment's Python in Scripts/, macOS and Linux in bin/.
PYTHON = next(
    (path for path in (BACKEND / '.venv' / 'Scripts' / 'python.exe', BACKEND / '.venv' / 'bin' / 'python') if path.exists()),
    None,
)


def is_backend_python(path: str) -> bool:
    edited = os.path.normcase(os.path.abspath(path))
    backend = os.path.normcase(str(BACKEND)) + os.sep
    venv = os.path.normcase(str(BACKEND / '.venv')) + os.sep
    return edited.endswith('.py') and edited.startswith(backend) and not edited.startswith(venv)


def main() -> int:
    event = json.load(sys.stdin)
    path = event.get('tool_input', {}).get('file_path', '')
    if not path or not is_backend_python(path) or PYTHON is None:
        return 0

    try:
        result = subprocess.run(
            [str(PYTHON), '-m', 'pytest', '-q', '-p', 'no:cacheprovider'],
            cwd=BACKEND,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        print('Back-end tests took longer than two minutes and were stopped.', file=sys.stderr)
        return 2
    if result.returncode == 0:
        return 0

    print(f'Back-end tests failed after editing {Path(path).name}:', file=sys.stderr)
    print(result.stdout[-3000:] + result.stderr[-1000:], file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main())
