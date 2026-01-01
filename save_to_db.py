# save_to_db.py
import json
from sqlalchemy.orm import sessionmaker
from models import init_db, Station, Price
from datetime import datetime

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
        print("错误：找不到 nsw_fuel_data.json，请先运行 fetch_fuel_data.py")
        return

    print("开始处理数据...")

    # 3. 处理站点数据 (Stations)
    # NSW API 返回的结构里，stations 是一个列表
    stations_data = data.get("stations", [])
    prices_data = data.get("prices", [])

    print(f"找到 {len(stations_data)} 个加油站，{len(prices_data)} 条价格记录。")

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
    
    # 提交一次，确保加油站都在库里了，后面存价格才不会报错
    session.commit()
    print("加油站数据处理完毕。")

    # --- 存入价格 ---
    for item in prices_data:
        s_code = item.get("stationcode")
        f_type = item.get("fueltype")
        price_val = item.get("price")
        
        # 处理时间字符串 (NSW 的时间格式可能需要调整)
        # 假设它是 standard ISO 或者我们需要简单处理
        # 这里暂时只存当前抓取时间，或者可以解析 item.get("lastupdated")
        
        # 创建价格记录
        new_price = Price(
            station_code=s_code,
            fuel_type=f_type,
            price=price_val,
            last_updated=datetime.now() # 暂时用当前时间，你可以后续优化解析 API 的时间
        )
        session.add(new_price)

    session.commit()
    print("🎉 成功！所有数据已存入 fuel.db 数据库。")
    session.close()

if __name__ == "__main__":
    load_data_to_db()