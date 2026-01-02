# save_to_db.py
import json
from sqlalchemy.orm import sessionmaker
from models import init_db, Station, Price
from datetime import datetime, timedelta

def load_data_to_db():
    # 1. 初始化数据库连接
    engine = init_db()
    Session = sessionmaker(bind=engine)
    session = Session()

    # 2. 读取下载的 JSON 文件
    try:
        with open("nsw_fuel_data.json", "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Error: nsw_fuel_data.json file not found. Please run the data download script first.")
        return

    print("Start processing data...")

    # 3. 处理站点数据 (Stations)
    # NSW API 返回的结构里，stations 是一个列表
    stations_data = data.get("stations", [])
    prices_data = data.get("prices", [])

    print(f"Found {len(stations_data)} stations and {len(prices_data)} price records.")

    # --- 存入加油站 ---
    for item in stations_data:
        # 提取字段
        code = item.get("code")
        name = item.get("name")
        brand = item.get("brand")
        address = item.get("address")
        loc = item.get("location", {})
        lat = loc.get("latitude")
        lng = loc.get("longitude")

        # 检查数据库里是否已经有这个站了 (避免重复插入)
        existing_station = session.query(Station).filter_by(code=code).first()
        
        if not existing_station:
            new_station = Station(
                code=code,
                name=name,
                brand=brand,
                address=address,
                latitude=lat,
                longitude=lng
            )
            session.add(new_station)
    
    # 提交一次，确保加油站都在库里
    session.commit()
    print("Petrol stations data saved.")

    # --- 存入价格 ---
    for item in prices_data:
        s_code = item.get("stationcode")
        f_type = item.get("fueltype")
        price_val = item.get("price")
        
        # 获取API给出的时间
        api_time_str = item.get("lastupdated")

        # 尝试解析 API 时间，如果解析失败就用当前时间
        try:
            official_update_time = datetime.strptime(api_time_str, "%d/%m/%Y %H:%M:%S")
        except (ValueError, TypeError):
            official_update_time = datetime.now()

        # 创建价格记录
        new_price = Price(
            station_code=s_code,
            fuel_type=f_type,
            price=price_val,
            last_updated=official_update_time,              # 解析 API 的时间
            captured_at = datetime.utcnow()                 # 当前时间的 UTC
        )
        session.add(new_price)

    session.commit()
    print("🎉 Successfully saved all data to the database.")
    session.close()

if __name__ == "__main__":
    load_data_to_db()