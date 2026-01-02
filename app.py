from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy.orm import sessionmaker
from models import init_db, Station, Price
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)
# 允许所有跨域请求
CORS(app, resources={r"/*": {"origins": "*"}})

# 初始化数据库连接
engine = init_db()
Session = sessionmaker(bind=engine)

def get_db_session():
    return Session()

@app.route('/')
def home():
    return jsonify({"status": "online", "time": datetime.now()})

# --- 核心接口 1: 获取地图数据 (含所有油号详情) ---
@app.route('/api/stations', methods=['GET'])
def get_stations():
    session = get_db_session()
    try:
        # 1. 查所有站点
        stations = session.query(Station).all()
        
        # 2. 查最近 24 小时的所有价格 (一次性查出，优化性能)
        yesterday = datetime.now() - timedelta(hours=24)
        recent_prices = session.query(Price).filter(Price.captured_at >= yesterday).all()

        # 3. 在内存中将价格按站点归类
        # 结构: { 'station_code_1': [PriceObj, PriceObj...], ... }
        price_map = defaultdict(list)
        for p in recent_prices:
            if p.price and p.price > 1: # 过滤脏数据
                price_map[p.station_code].append({
                    "type": p.fuel_type,
                    "price": p.price,
                    "updated": p.last_updated
                })

        # 4. 组装返回给前端的数据
        result = []
        for s in stations:
            station_prices = price_map.get(s.code, [])
            
            # 计算一个“主要价格”用于在地图图钉上直接显示 (优先显示 E10)
            display_price = "N/A"
            for p in station_prices:
                if p['type'] == 'E10':
                    display_price = p['price']
                    break
            # 如果没有 E10，就显示列表里的第一个价格
            if display_price == "N/A" and station_prices:
                display_price = station_prices[0]['price']

            result.append({
                "code": s.code,
                "name": s.name,
                "address": s.address,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "brand": s.brand,
                "prices": station_prices,     # 这是一个列表，包含该站所有油价
                "display_price": display_price # 这是一个数字，用于地图标点简略显示
            })
        
        return jsonify(result)
    finally:
        session.close()

# --- 核心接口 2: 排行榜 (支持筛选) ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    session = get_db_session()
    try:
        # 获取前端传来的参数，默认为 E10
        # 例如: /api/stats?fuel_type=Diesel
        target_fuel = request.args.get('fuel_type', 'E10')

        # 查询该油号最便宜的 5 个
        cheapest = session.query(Price)\
            .filter(Price.price > 10)\
            .filter(Price.fuel_type == target_fuel)\
            .order_by(Price.price.asc())\
            .limit(5)\
            .all()
        
        result = []
        # 用来记录这批数据里最新的时间
        latest_update = None 

        for p in cheapest:
            station = session.query(Station).filter_by(code=p.station_code).first()
            result.append({
                "price": p.price,
                "fuel_type": p.fuel_type,
                "station": station.name if station else "Unknown",
                "address": station.address if station else "",
                "updated": p.last_updated
            })
        
        # 查询整个数据库中，最新的“抓取时间” (captured_at)
        latest_capture = session.query(Price.captured_at)\
            .order_by(Price.captured_at.desc())\
            .first()
        
        # 提取时间 (如果是空库，就用当前时间)
        system_time = latest_capture[0] if latest_capture else datetime.now()

        return jsonify({
            "title": f"Cheapest {target_fuel}",
            "cheapest_5": result,
            "data_updated_at": system_time # 返回给前端显示
        })
    finally:
        session.close()

if __name__ == '__main__':
    # 启动后端
    app.run(debug=True, port=5000)