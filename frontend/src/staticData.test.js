import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStaticData, computeStats } from './staticData.js';

const raw = {
  stations: [
    {
      code: '1',
      name: 'Station A',
      brand: 'Brand A',
      address: '1 A St',
      location: { latitude: -33.1, longitude: 151.1 },
    },
    {
      code: '2',
      name: 'Station B',
      brand: 'Brand B',
      address: '2 B St',
      location: { latitude: -33.2, longitude: 151.2 },
    },
    {
      code: '3',
      name: 'Stale Station',
      brand: 'Brand C',
      address: '3 C St',
      location: { latitude: -33.3, longitude: 151.3 },
    },
  ],
  prices: [
    {
      stationcode: '1',
      fueltype: 'E10',
      price: 180,
      lastupdated: '12/07/2026 02:20:00',
    },
    {
      stationcode: '1',
      fueltype: 'U91',
      price: 175,
      lastupdated: '12/07/2026 02:20:00',
    },
    {
      stationcode: '1',
      fueltype: 'E10',
      price: 999,
      lastupdated: '01/07/2026 02:20:00',
    },
    {
      stationcode: '2',
      fueltype: 'E10',
      price: 170,
      lastupdated: '12/07/2026 02:25:02',
    },
    {
      stationcode: '2',
      fueltype: 'E10',
      price: 5,
      lastupdated: '12/07/2026 02:25:02',
    },
    {
      stationcode: '3',
      fueltype: 'E10',
      price: 160,
      lastupdated: '01/07/2026 02:20:00',
    },
  ],
};

test('buildStaticData filters stale and invalid prices, keeps latest per fuel, and computes display_price', () => {
  const { stations, dataUpdatedAt } = buildStaticData(raw);

  assert.equal(stations.length, 2);

  const stationA = stations.find((s) => s.code === '1');
  const stationB = stations.find((s) => s.code === '2');

  assert.deepEqual(
    stationA.prices.map((p) => p.type).sort(),
    ['E10', 'U91'],
  );
  assert.equal(stationA.display_price, 180);
  assert.equal(stationA.prices.find((p) => p.type === 'E10').price, 180);
  assert.equal(stationB.prices.length, 1);
  assert.equal(stationB.display_price, 170);
  assert.equal(new Date(dataUpdatedAt).toISOString(), '2026-07-12T02:25:02.000Z');
});

test('computeStats returns cheapest stations for the requested fuel type', () => {
  const { stations, dataUpdatedAt } = buildStaticData(raw);
  const stats = computeStats(stations, dataUpdatedAt, 'E10');

  assert.equal(stats.cheapest_5.length, 2);
  assert.equal(stats.cheapest_5[0].station, 'Station B');
  assert.equal(stats.cheapest_5[0].price, 170);
  assert.equal(stats.cheapest_5[1].station, 'Station A');
});
