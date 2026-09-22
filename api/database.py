import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# 加载 .env
load_dotenv()

# 优先读取环境变量
DATABASE_URL = os.getenv("DATABASE_URL")

# Local development fallback. Vercel must provide DATABASE_URL in Project Settings.
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
    pool_pre_ping=True,
    pool_recycle=300
)

# Session Factory
SessionLocal = scoped_session(
    sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
)
