from api.database import engine
from api.models import Base

def init_db():
    Base.metadata.create_all(bind=engine)