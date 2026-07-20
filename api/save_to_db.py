from models import Station, Price
from datetime import datetime, timedelta
from database import SessionLocal

def load_data_to_db(data):
    # 1. 初始化数据库连接
    session = SessionLocal()

    # 2. 读取下载的 data 变量
    stations_data = data.get("stations", [])
    prices_data = data.get("prices", [])

    print(f"[{datetime.now()}] 正在处理数据...")

    # --- 策略 1: 清理旧数据 ---
    # 删除 7 天前的价格记录，释放数据库空间
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    deleted_count = session.query(Price).filter(Price.captured_at < seven_days_ago).delete()
    if deleted_count:
        print(f"🧹 已清理 {deleted_count} 条 7 天前的历史价格记录。")

    stations_data = data.get("stations", [])
    prices_data = data.get("prices", [])

    # --- 策略 2: 处理加油站 (Stations) ---
    # 获取数据库里已有的站点代码，避免重复插入
    existing_stations = {s.code for s in session.query(Station.code).all()}
    
    new_stations_count = 0
    for item in stations_data:
        code = item.get("code")
        if code not in existing_stations:
            new_station = Station(
                code=code,
                name=item.get("name"),
                brand=item.get("brand"),
                address=item.get("address"),
                latitude=item.get("location", {}).get("latitude"),
                longitude=item.get("location", {}).get("longitude")
            )
            session.add(new_station)
            existing_stations.add(code)
            new_stations_count += 1
    
    if new_stations_count:
        session.commit()
        print(f"🏠 成功录入 {new_stations_count} 个新加油站。")

    # --- 策略 3: 处理价格 (Prices) 且去重 ---
    # 获取数据库中最近 48 小时的价格“指纹”，用于去重
    # 指纹格式: (station_code, fuel_type, last_updated)
    lookback_time = datetime.utcnow() - timedelta(hours=48)
    existing_prices_query = session.query(Price.station_code, Price.fuel_type, Price.last_updated)\
                                   .filter(Price.last_updated >= lookback_time).all()
    
    # 转换为 set 提高查询效率 (指纹比对)
    existing_price_fingerprints = set(existing_prices_query)

    new_prices_list = []
    skipped_duplicate = 0
    skipped_invalid = 0

    for item in prices_data:
        # 1. 解析 API 时间
        api_time_str = item.get("lastupdated")
        try:
            # NSW API 时间格式通常为 "DD/MM/YYYY HH:MM:SS"
            official_update_time = datetime.strptime(api_time_str, "%d/%m/%Y %H:%M:%S")
        except (ValueError, TypeError):
            skipped_invalid += 1
            continue
        
        # 2. 构造当前数据的指纹
        station_code = item.get("stationcode")
        fuel_type = item.get("fueltype")
        price_val = item.get("price")
        
        fingerprint = (station_code, fuel_type, official_update_time)

        # 3. 去重检查：如果指纹已存在，说明这条油价更新已经录入过了
        if fingerprint in existing_price_fingerprints:
            skipped_duplicate += 1
            continue

        # 4. 创建新纪录
        new_prices_list.append(Price(
            station_code=station_code,
            fuel_type=fuel_type,
            price=price_val,
            last_updated=official_update_time,
            captured_at=datetime.utcnow()
        ))
        # 同时添加到 set 里，防止同一批 JSON 数据里有重复项
        existing_price_fingerprints.add(fingerprint)

    # 批量提交价格数据
    if new_prices_list:
        session.add_all(new_prices_list)
        session.commit()
        print(f"✅ 成功更新 {len(new_prices_list)} 条新油价。")
    
    print(f"ℹ️ 本次忽略: {skipped_duplicate} 条重复数据, {skipped_invalid} 条无效数据。")
    
    session.close()
    print(f"[{datetime.now()}] ETL 任务结束。\n")