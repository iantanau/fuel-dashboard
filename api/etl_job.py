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
    
    try:

        # 2. 获取 NSW Fuel API 数据并返回 Python Dictionary
        data = fetch_fuel_data(token)

        if not data:
            print("❌ Failed to fetch fuel data.")
            return

        # 3. 存入数据库
    
        load_data_to_db(data)
        print(f"[{datetime.now()}] ✅ Automation task completed successfully! Waiting for next scheduled run...")
    
    except Exception as e:
        print(f"❌ Error in Load stage: {e}")

if __name__ == "__main__":
    # 手动测试一次
    run_etl_pipeline()