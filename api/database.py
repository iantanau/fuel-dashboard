import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# 加载 .env
load_dotenv()

# 优先读取环境变量
DATABASE_URL = os.getenv("DATABASE_URL")

# 本地开发时如果没有 DATABASE_URL，则使用 SQLite
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///fuel.db"

# SQLAlchemy 需要 postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )

# 创建 Engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

# Session Factory
SessionLocal = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
)