from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

# 1. 定义基类
Base = declarative_base()

# 2. 定义加油站表 (Station Model)
class Station(Base):
    __tablename__ = 'stations'

    # 用 NSW 的 'code' 作为主键
    code = Column(String, primary_key=True) 
    name = Column(String)     # 如 "United Petroleum Umina"
    brand = Column(String)    # 如 "United"
    address = Column(String)  # 如 "307-313 Ocean Beach Road..."
    latitude = Column(Float)  # 经纬度用于后续画地图
    longitude = Column(Float)

    # 关联关系：一个加油站有多个价格记录
    prices = relationship("Price", back_populates="station")

    def __repr__(self):
        return f"<Station(name='{self.name}', code='{self.code}')>"

# 3. 定义价格表 (Price Model)
class Price(Base):
    __tablename__ = 'prices'

    id = Column(Integer, primary_key=True, autoincrement=True)  # 内部流水号
    station_code = Column(String, ForeignKey('stations.code'))  # 外键关联加油站
    fuel_type = Column(String)                                  # 如 "E10", "P98"
    price = Column(Float)                                       # 如 179.9
    last_updated = Column(DateTime)                             # NSW API 提供的更新时间
    captured_at = Column(DateTime, default=lambda: datetime.utcnow()) # 抓取的时间

    __table_args__ = (
        UniqueConstraint('station_code', 'fuel_type', 'last_updated', name='_station_fuel_time_uc'),
    )

    # 关联关系
    station = relationship("Station", back_populates="prices")

    def __repr__(self):
        return f"<Price(type='{self.fuel_type}', price={self.price})>"

# 4. 初始化数据库的函数
def init_db(connection_string='sqlite:///fuel.db'):
    if not (connection_string.startswith("sqlite://") or connection_string.startswith("postgresql://")):
            connection_string = f'sqlite:///{connection_string}'

    engine = create_engine(connection_string)
    Base.metadata.create_all(engine)
    print(f"Database initialized with: {connection_string[:20]}...") 
    return engine