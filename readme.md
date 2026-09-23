# NSW Fuel Watch Dashboard

A static React dashboard that visualises a snapshot of NSW fuel prices on an
interactive Leaflet map. It runs entirely in the browser with no serverless
functions, database, cron jobs, or Supabase dependency.

## Data

The dashboard reads `frontend/public/data/fuel_data.json`, a static snapshot of
the NSW FuelCheck API. The browser filters prices to the latest 72 hours,
groups them by station, and calculates the cheapest five stations per fuel type.

To refresh the snapshot manually, replace
`frontend/public/data/fuel_data.json` with a new export containing:

```json
{
  "stations": [],
  "prices": []
}
```

The price records use:

```json
{
  "stationcode": "972",
  "fueltype": "E10",
  "price": 179.9,
  "lastupdated": "12/07/2026 02:25:02"
}
```

## Local Development

```bash
cd frontend
npm install
npm run dev
```

## Production Build

```bash
cd frontend
npm install
npm run build
```

The build output is written to `frontend/dist`. Vercel uses the settings in
`vercel.json` to run the build and serve that directory as a static site.
