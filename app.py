# app.py
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy.orm import sessionmaker
from models import init_db, Station, Price
from datetime import datetime, timedelta

app = Flask(__name__)
# 允许所有来源跨域访问 (在生产环境中应该限制具体域名，但开发时为了方便先全部允许)
CORS(app) 

# 初始化数据库连接
engine = init_db()
Session = sessionmaker(bind=engine)

def get_db_session():
    """每次请求创建一个新的会话"""
    return Session()

# ---------------- API 接口定义 ----------------

@app.route('/')
def home():
    """根路由，测试 API 是否活着"""
    return jsonify({
        "status": "online", 
        "message": "Welcome to Fuel Dashboard API",
        "time": datetime.now()
    })

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """
    获取所有加油站的信息 + 最新价格
    用于前端地图展示
    """
    session = get_db_session()
    try:
        # 查询所有加油站
        stations = session.query(Station).all()
        
        result = []
        for s in stations:
            # 简单粗暴的方法：为每个加油站查一次最新价格
            # 在数据量巨大时这叫 "N+1 查询问题"，解决方案：
            # 1. 使用 SQLAlchemy 的 joinedload 进行预加载 (Eager Loading)
            # 2. 用原生的 SQL JOIN 语句一次性把 Station 和最新 Price 查出来
            latest_price_entry = session.query(Price)\
                .filter_by(station_code=s.code)\
                .order_by(Price.captured_at.desc())\
                .first()
            
            current_price = None
            if latest_price_entry and latest_price_entry.price > 10:
                current_price = latest_price_entry.price

            fuel_type = latest_price_entry.fuel_type if latest_price_entry else None
            last_updated = latest_price_entry.last_updated if latest_price_entry else None

            result.append({
                "code": s.code,
                "name": s.name,
                "brand": s.brand,
                "address": s.address,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "current_price": current_price,
                "fuel_type": fuel_type,
                "last_updated": last_updated
            })
        
        return jsonify(result)
    finally:
        session.close()

@app.route('/api/station/<code_id>/history', methods=['GET'])
def get_station_history(code_id):
    """
    获取指定加油站的价格历史
    用于前端画折线图
    """
    session = get_db_session()
    try:
        # 查询该站点过去 7 天的数据
        week_ago = datetime.now() - timedelta(days=7)
        
        prices = session.query(Price)\
            .filter_by(station_code=code_id)\
            .filter(Price.captured_at >= week_ago)\
            .order_by(Price.captured_at.asc())\
            .all()
        
        history = []
        for p in prices:
            history.append({
                "price": p.price,
                "captured_at": p.captured_at.strftime("%Y-%m-%d %H:%M"), # 格式化时间
                "fuel_type": p.fuel_type
            })
            
        return jsonify({
            "station_code": code_id,
            "history": history
        })
    finally:
        session.close()

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    获取统计信息 (例如：当前最低价)
    """
    session = get_db_session()
    try:

        # 设置过滤条件
        target_fuel = "E10"

        # 找大于10cent的最便宜的 5 个
        cheapest = session.query(Price)\
            .filter(Price.price > 10)\
            .filter(Price.fuel_type == target_fuel)\
            .order_by(Price.price.asc())\
            .limit(5)\
            .all()
        
        result = []
        for p in cheapest:
            # 关联查询站点名字
            station = session.query(Station).filter_by(code=p.station_code).first()
            result.append({
                "price": p.price,
                "fuel_type": p.fuel_type,
                "station": station.name if station else "Unknown",
                "address": station.address if station else "",
                "lat": station.latitude if station else 0,
                "lng": station.longitude if station else 0
            })
            
        return jsonify({
            "title": f"Top 5 Cheapest {target_fuel}",       # 标题
            "cheapest_5": result,                           # 最便宜的 5 个加油站
            "total_records": session.query(Price).count()   # 总记录数
        })
    finally:
        session.close()

if __name__ == '__main__':
    # 启动 Flask 服务
    # debug=True 意味着你修改代码保存后，服务器会自动重启，方便开发
    print("🚀 Flask API 服务器启动中...")
    app.run(debug=True, port=5000)