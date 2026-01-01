# scheduler.py
from apscheduler.schedulers.blocking import BlockingScheduler
from etl_job import run_etl_pipeline
from datetime import datetime
import os

def job_function():
    print(f"⏰ 触发定时任务: {datetime.now()}")
    run_etl_pipeline()

if __name__ == "__main__":
    # 创建调度器
    scheduler = BlockingScheduler()
    
    # 添加任务：每 30 分钟运行一次
    # jitter=60 表示允许延迟 60 秒内执行，防止并发高峰（这是一个高级参数，面试可以说）
    scheduler.add_job(job_function, 'interval', minutes=30, jitter=60)
    
    print("🤖 数据监控机器人已启动...")
    print("按 Ctrl+C 退出")
    
    # 若需要测试，取消下面这行的注释
    # job_function()
    
    try:
        # 开始阻塞运行
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        print("机器人已停止。")