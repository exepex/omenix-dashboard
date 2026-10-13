"""Turn a password read from stdin into a PostgreSQL SCRAM-SHA-256 verifier (the form PostgreSQL stores).

Used by setup_monitor.sh so that only the verifier is sent to the server in ALTER ROLE ... PASSWORD: the plain
password never reaches the server (where statement logging could record it) and is never typed, shown or written.
Standard library only. The passwords are generated as ASCII letters and digits, so SASLprep leaves them unchanged.
"""

import base64
import hashlib
import hmac
import os
import sys

ITERATIONS = 4096  # PostgreSQL's default scram_iterations


def scram_verifier(password: bytes, salt: bytes, iterations: int = ITERATIONS) -> str:
    salted = hashlib.pbkdf2_hmac("sha256", password, salt, iterations)
    client_key = hmac.new(salted, b"Client Key", hashlib.sha256).digest()
    stored_key = hashlib.sha256(client_key).digest()
    server_key = hmac.new(salted, b"Server Key", hashlib.sha256).digest()

    def b64(data: bytes) -> str:
        return base64.b64encode(data).decode("ascii")

    return f"SCRAM-SHA-256${iterations}:{b64(salt)}${b64(stored_key)}:{b64(server_key)}"


def main() -> None:
    password = sys.stdin.read().rstrip("\n").encode("ascii")
    if len(password) < 32:
        sys.exit("refusing a password shorter than 32 characters")
    print(scram_verifier(password, os.urandom(16)))


if __name__ == "__main__":
    main()
