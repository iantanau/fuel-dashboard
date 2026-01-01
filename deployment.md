# 生产环境部署指南 (Production Deployment)

## 设置定时任务 (Cron Job)

为了确保每 30 分钟自动更新油价数据，请在 Linux 服务器上执行以下步骤：

1. 编辑 Crontab 配置：
   crontab -e

2. 添加以下行 (假设项目路径为 /home/ubuntu/fuel-dashboard)：
   # 格式: m h  dom mon dow   command
   # 含义: 每小时的第 0 分和第 30 分钟执行一次 (*/30)
   
   */30 * * * * cd /home/ubuntu/fuel-dashboard && /home/ubuntu/fuel-dashboard/venv/bin/python etl_job.py >> /var/log/fuel_cron.log 2>&1

## 解释
- `cd ...`: 必须先进入目录，否则脚本找不到 nsw_fuel_data.json 文件。
- `venv/bin/python`: 必须使用虚拟环境里的 Python 解释器。
- `>> ...`: 将日志输出到文件，方便排查错误 (Logging)。