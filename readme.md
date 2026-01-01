# ⛽ NSW Fuel Watch Dashboard

A full-stack data visualization dashboard tracking real-time fuel prices across New South Wales, Australia. This project demonstrates an automated ETL pipeline, RESTful API development, and interactive geospatial visualization.

![Tech Stack](https://img.shields.io/badge/Tech-Full%20Stack-blue)
![Python](https://img.shields.io/badge/Backend-Flask%20%7C%20SQLAlchemy-green)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Tailwind-blue)

## 🚀 Features

*   **Real-time Data Pipeline:** Automated script fetches live fuel price data from NSW Government API every 30 minutes.
*   **Data Persistence:** Stores historical pricing and geospatial data in a SQLite/PostgreSQL database using SQLAlchemy ORM.
*   **Interactive Map:** Visualizes over 2,000+ service stations on a Leaflet map with clustering and custom popups.
*   **Price Analytics:** identifies the cheapest stations for different fuel types (E10, Diesel, P98, etc.).
*   **API Integration:** Robust error handling and OAuth2 authentication with government APIs.

## 🛠️ Tech Stack

*   **Backend:** Python 3, Flask, SQLAlchemy, APScheduler
*   **Frontend:** React.js (Vite), Tailwind CSS, Leaflet.js (Maps), Axios
*   **Database:** SQLite (Dev) / PostgreSQL (Prod ready)
*   **Data Source:** NSW FuelCheck API

## 📦 How to Run

### 1. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors sqlalchemy requests apscheduler

# Run the API server
python app.py
```
### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
### 3. Data Pipeline (Optional)
``` bash
# To trigger a manual data fetch:
python etl_job.py
```