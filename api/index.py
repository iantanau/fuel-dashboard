from flask import Flask, jsonify, request
from flask_cors import CORS
from models import Station, Price
from init_db import init_db
from datetime import datetime, timedelta
from collections import defaultdict
from database import SessionLocal
from models import create_tables
import threading

app = Flask(__name__)
# 允许跨域
CORS(app, resources={r"/*": {"origins": "*"}})

# --- 数据库配置 ---
create_tables()
Session = SessionLocal


@app.teardown_appcontext
def shutdown_session(exception=None):
    """
    每次请求结束后自动关闭数据库连接，防止连接泄露
    """
    Session.remove()

@app.route('/')
def home():
    return jsonify({
        "status": "online", 
        "server_time_utc": datetime.utcnow().isoformat()
    })

# --- 核心接口 1: 获取地图数据 (所有站点及最新价格) ---
@app.route('/api/stations', methods=['GET'])
def get_stations():
    # 1. 查所有站点
    stations = Session.query(Station).all()
    
    # 2. 查最近 72 小时的有效价格
    yesterday = datetime.utcnow() - timedelta(hours=72)
    recent_prices = Session.query(Price).filter(
        Price.captured_at >= yesterday,
        Price.price > 10 # 过滤异常极低值
    ).all()

    # 3. 内存中归类：{ 'station_code': [price_info, ...] }
    price_map = defaultdict(list)
    for p in recent_prices:
        price_map[p.station_code].append({
            "type": p.fuel_type,
            "price": p.price,
            "updated": p.last_updated.isoformat() if p.last_updated else None
        })

    # 4. 组装结果
    result = []
    for s in stations:
        station_prices = price_map.get(s.code, [])

        # 如果这个加油站最近 24h 没有更新过价格，跳过（不显示过期油价）
        if not station_prices:
            continue
        
        # 确定主显示价格 (优先级: E10 > 列表第一个)
        display_price = next((p['price'] for p in station_prices if p['type'] == 'E10'), station_prices[0]['price'])

        result.append({
            "code": s.code,
            "name": s.name,
            "address": s.address,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "brand": s.brand,
            "prices": station_prices,
            "display_price": display_price
        })
    
    return jsonify(result)

# --- 核心接口 2: 排行榜 (使用 JOIN 优化性能) ---
@app.route('/api/stats', methods=['GET'])
def get_stats():
    target_fuel = request.args.get('fuel_type', 'E10')

    # 使用 JOIN 一次性查出价格和对应的加油站信息
    # 过滤掉 24 小时之前的陈旧数据
    one_day_ago = datetime.utcnow() - timedelta(hours=24)
    
    stats_query = Session.query(Price, Station)\
        .join(Station, Price.station_code == Station.code)\
        .filter(Price.fuel_type == target_fuel)\
        .filter(Price.last_updated >= one_day_ago)\
        .filter(Price.price > 10)\
        .order_by(Price.price.asc())\
        .limit(5)\
        .all()
    
    cheapest_list = []
    for p, s in stats_query:
        cheapest_list.append({
            "price": p.price,
            "fuel_type": p.fuel_type,
            "station": s.name,
            "brand": s.brand,
            "address": s.address,
            "lat": s.latitude,
            "lng": s.longitude,
            "updated": p.last_updated.isoformat(),
            "code": p.station_code
        })
    
    # 获取系统最后一次成功抓取数据的时间
    latest_capture = Session.query(Price.captured_at)\
        .order_by(Price.captured_at.desc())\
        .first()
    
    update_time = latest_capture[0].isoformat() if latest_capture else None

    return jsonify({
        "title": f"Cheapest {target_fuel} (Last 24h)",
        "cheapest_5": cheapest_list,
        "data_updated_at": update_time
    })

if __name__ == '__main__':
    # --- 启动时自动运行一次 ETL ---
    print("Initializing data... Please wait.")
    # 开启一个新线程在后台偷偷抓取（服务器秒开，数据随后就到）
    task = threading.Thread(target=run_etl_pipeline)
    task.start()
    # # 生产环境建议使用 Gunicorn 启动
    # app.run(debug=True, host='0.0.0.0', port=5000)