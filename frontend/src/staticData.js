const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

let dataPromise;

export function parseApiDate(value) {
  const [datePart, timePart] = value.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}

export function loadFuelData(url = '/data/fuel_data.json') {
  if (!dataPromise) {
    dataPromise = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load fuel data: ${response.status}`);
      }
      return response.json();
    });
  }
  return dataPromise;
}

function latestPriceByFuel(entries) {
  const latest = new Map();
  for (const entry of entries) {
    const existing = latest.get(entry.type);
    if (!existing || entry.updated > existing.updated) {
      latest.set(entry.type, entry);
    }
  }
  return [...latest.values()].sort((a, b) => a.updated - b.updated);
}

export function buildStaticData(raw) {
  const stationList = raw.stations || [];
  const priceList = raw.prices || [];

  const parsedPrices = priceList
    .map((price) => ({ price, updated: parseApiDate(price.lastupdated) }))
    .filter(({ price, updated }) => Number.isFinite(updated.getTime()) && price.price > 10);

  const newestUpdate = parsedPrices.length
    ? Math.max(...parsedPrices.map(({ updated }) => updated.getTime()))
    : Date.now();
  const cutoff = newestUpdate - SEVENTY_TWO_HOURS_MS;

  const pricesByStation = new Map();
  for (const { price, updated } of parsedPrices) {
    if (updated.getTime() < cutoff) continue;
    const entries = pricesByStation.get(price.stationcode) || [];
    entries.push({ type: price.fueltype, price: price.price, updated });
    pricesByStation.set(price.stationcode, entries);
  }

  const stationsByCode = new Map(stationList.map((station) => [station.code, station]));
  const stations = [];

  for (const [code, entries] of pricesByStation) {
    const station = stationsByCode.get(code);
    if (!station) continue;

    const prices = latestPriceByFuel(entries).map((entry) => ({
      type: entry.type,
      price: entry.price,
      updated: entry.updated.toISOString(),
    }));
    const e10 = prices.find((price) => price.type === 'E10');

    stations.push({
      code: station.code,
      name: station.name,
      address: station.address,
      latitude: station.location?.latitude,
      longitude: station.location?.longitude,
      brand: station.brand,
      prices,
      display_price: e10?.price ?? prices[0]?.price,
    });
  }

  return {
    stations,
    dataUpdatedAt: new Date(newestUpdate).toISOString(),
  };
}

export function computeStats(stations, dataUpdatedAt, fuelType) {
  const cheapest = stations
    .map((station) => {
      const price = station.prices.find((entry) => entry.type === fuelType);
      if (!price) return null;

      return {
        price: price.price,
        fuel_type: fuelType,
        station: station.name,
        brand: station.brand,
        address: station.address,
        lat: station.latitude,
        lng: station.longitude,
        updated: price.updated,
        code: station.code,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);

  return {
    title: `Cheapest ${fuelType} (Last 24h)`,
    cheapest_5: cheapest,
    data_updated_at: dataUpdatedAt,
  };
}

export async function getStaticData() {
  const raw = await loadFuelData();
  return buildStaticData(raw);
}

export async function getStations() {
  const { stations } = await getStaticData();
  return stations;
}

export async function getStats(fuelType) {
  const { stations, dataUpdatedAt } = await getStaticData();
  return computeStats(stations, dataUpdatedAt, fuelType);
}
