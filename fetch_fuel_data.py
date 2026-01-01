import requests
import time
import uuid
from datetime import datetime
import os

# ================= 配置区域 =================
# API Key 和 Secret
API_KEY = os.getenv("NSW_API_KEY")
API_SECRET = os.getenv("NSW_API_SECRET")

# NSW API 换取 Token 地址
TOKEN_URL = "https://api.onegov.nsw.gov.au/oauth/client_credential/accesstoken"

# 油价数据接口地址
DATA_URL = "https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices" 
# ===========================================

def get_access_token():
    """
    第一步：用 Key 和 Secret 换取 Access Token
    """
    print("正在获取 Access Token...")
    
    # query string 参数
    params = {
        "grant_type": "client_credentials"
    }
    
    # requests 的 auth 参数会自动把 Key:Secret 转成 Base64 的 Authorization Header
    try:
        response = requests.get(TOKEN_URL, params=params, auth=(API_KEY, API_SECRET))
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            print(f"成功获取 Token! (前10位): {access_token[:10]}...")
            return access_token
        else:
            print(f"获取 Token 失败。状态码: {response.status_code}")
            print(f"错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"网络请求出错: {e}")
        return None

def fetch_fuel_data(token):
    print("\n正在尝试下载油价数据...")
    
    # 获取数据 URL
    target_url = "https://api.onegov.nsw.gov.au/FuelPriceCheck/v1/fuel/prices"
    
    # 生成符合格式的时间戳
    timestamp = datetime.now().strftime("%d/%m/%Y %I:%M:%S %p")
    trans_id = str(uuid.uuid4())

    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": API_KEY,
        "transactionID": trans_id,
        "requestTimeStamp": timestamp,
        "Accept": "application/json"
    }

    params = {
        "fueltype": "E10",    # 只取 E10
        "latitude": -33.8688, # 悉尼
        "longitude": 151.2093,
        "radius": 5
    }

    try:
        print(f"请求 URL: {target_url}")
        response = requests.get(target_url, headers=headers, params=params)
        
        if response.status_code == 200:
            print("✅ 获取信息成功！！")
            data = response.json()
            
            import json
            with open("nsw_fuel_data.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
            print("数据已保存到 nsw_fuel_data.json")
            
        else:
            print(f"❌ 获取信息失败。状态码: {response.status_code}")
            print(f"错误信息: {response.text}")

    except Exception as e:
        print(f"代码出错: {e}")

if __name__ == "__main__":
    # 执行流程
    token = get_access_token()
    if token:
        fetch_fuel_data(token)