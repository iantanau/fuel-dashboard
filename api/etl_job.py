import time
from datetime import datetime
from fetch_fuel_data import get_access_token, fetch_fuel_data
from save_to_db import load_data_to_db

def run_etl_pipeline():
    """
    执行一次完整的 ETL 流程：
    1. 登录拿 Token
    2. 下载数据 (Extract)
    3. 存入数据库 (Load)
    """
    print(f"\n[{datetime.now()}] 🚀 Starting ETL pipeline...")
    
    # 1. 获取 Token
    token = get_access_token()
    if not token:
        print("❌ Task terminated: Unable to obtain Token")
        return

    # 2. 抓取数据 (这会生成/覆盖 nsw_fuel_data.json)
    # 注意：你需要确保 fetch_fuel_data.py 里的 fetch_fuel_data 函数
    # 会把数据写入文件，或者你可以修改它让它返回 data 对象。
    # 鉴于我们之前的写法是存文件，这里直接调用即可。
    fetch_fuel_data(token)
    
    # 休息 2 秒，确保文件写入完成 (虽然通常不需要，但为了稳健)
    time.sleep(2)

    # 3. 存入数据库
    try:
        load_data_to_db()
        print(f"[{datetime.now()}] ✅ Automation task completed successfully! Waiting for next scheduled run...")
    except Exception as e:
        print(f"❌ Error in Load stage: {e}")

if __name__ == "__main__":
    # 手动测试一次
    run_etl_pipeline()