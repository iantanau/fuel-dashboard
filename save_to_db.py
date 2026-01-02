# save_to_db.py
import json
from sqlalchemy.orm import sessionmaker
from models import init_db, Station, Price
from datetime import datetime, timezone, timedelta

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
    
    # 策略：先清理掉 7 天前的价格数据，避免数据库膨胀
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    deleted_count = session.query(Price).filter(Price.captured_at < seven_days_ago).delete()
    if deleted_count:
        print(f"Pruned {deleted_count} old price records older than 7 days.")
    
    stations_data = data.get("stations", [])
    prices_data = data.get("prices", [])

    print(f"Found {len(stations_data)} stations and {len(prices_data)} price records.")

    # --- 1. 处理加油站数据 ---
    # 站点信息通常不会变，所以只做 "Insert if not exists"
    existing_codes = {s.code for s in session.query(Station).all()}

    new_stations = []

    # --- 存入加油站 ---
    for item in stations_data:
        code = item.get("code")
        if code not in existing_codes:
            new_stations.append(Station(
                code=code,
                name=item.get("name"),
                brand=item.get("brand"),
                address=item.get("address"),
                latitude=item.get("location", {}).get("latitude"),
                longitude=item.get("location", {}).get("longitude")
            ))
            existing_codes.add(code) # 避免同一次批次里有重复

    if new_stations:
        session.add_all(new_stations)
        session.commit()
    print(f" {len(new_stations)} Petrol stations data saved.")
    
    # --- 2. 处理价格数据 ---
    new_prices = []

    # 设定一个“有效时间门槛”，比如 30 天
    # 即：如果官方 last_updated 早于 30 天前，我们认为这是僵尸数据，不录入
    valid_threshold = datetime.now() - timedelta(days=30)
    skipped_count = 0

    # --- 存入价格 ---
    for item in prices_data:
        # 获取API给出的时间
        api_time_str = item.get("lastupdated")

        # 尝试解析 API 时间，如果解析失败就用当前时间
        try:
            official_update_time = datetime.strptime(api_time_str, "%d/%m/%Y %H:%M:%S")
        except (ValueError, TypeError):
            skipped_count += 1
            continue
        
        # 检查：如果官方更新时间早于 30 天前，跳过
        if official_update_time < valid_threshold:
            skipped_count += 1
            continue

        # 创建价格记录
        new_prices.append(Price(
            station_code=item.get("stationcode"),
            fuel_type=item.get("fueltype"),
            price=item.get("price"),
            last_updated=official_update_time, # 官方改价时间
        ))

    # 批量插入
    if new_prices:
        session.add_all(new_prices)
        session.commit()
        print(f"🎉 Successfully saved {len(new_prices)} data to the database.")
        print(f"Skipped {skipped_count} invalid or outdated price records.")
    
    session.close()

if __name__ == "__main__":
    load_data_to_db()