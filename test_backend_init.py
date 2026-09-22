import os
import sys
import tempfile
from pathlib import Path


API_DIR = Path(__file__).resolve().parent / "api"
sys.path.insert(0, str(API_DIR))

test_db_path = Path(tempfile.gettempdir()) / f"fuel_test_{os.getpid()}.db"
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path.as_posix()}"

from database import engine
from init_db import init_db


def main():
    result = init_db()
    assert result is engine, "init_db() must return the SQLAlchemy engine"
    print("init_db returned the engine")


if __name__ == "__main__":
    main()
