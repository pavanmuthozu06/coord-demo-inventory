#!/usr/bin/env node
// Deterministic mock-data generator (seeded PRNG) — FICTIONAL sample data, not
// real inventory. Run: `npm run data` → writes data/inventory.json + movements.json

import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const outDir = path.join(here, '..', 'data')
const TODAY = new Date('2026-09-18T00:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const iso = (d) => d.toISOString().slice(0, 10)

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260918)

// Illustrative office locations (mock).
const LOCATIONS = [
  { code: 'BLR', name: 'Bengaluru' },
  { code: 'MAA', name: 'Chennai' },
  { code: 'HYD', name: 'Hyderabad' },
  { code: 'DTW', name: 'Southfield (MI)' },
]
// Fictional suppliers.
const SUPPLIERS = ['Northwind Traders', 'Contoso Supply', 'Fabrikam Devices', 'Globex Office']

// [prefix, category, name, unitCost (USD), reorderLevel]
const CATALOG = [
  ['LAP', 'Laptops', 'Dell Latitude 7440 14"', 1450, 8],
  ['LAP', 'Laptops', 'MacBook Pro 14" (M3)', 2100, 6],
  ['LAP', 'Laptops', 'Lenovo ThinkPad T14', 1300, 8],
  ['MON', 'Monitors', 'Dell U2723QE 27" 4K', 620, 10],
  ['MON', 'Monitors', 'LG 24" FHD', 190, 15],
  ['DOC', 'Docks & Adapters', 'Thunderbolt 4 Dock', 240, 12],
  ['DOC', 'Docks & Adapters', 'USB-C Hub 7-in-1', 45, 40],
  ['PER', 'Peripherals', 'Logitech MX Keys', 110, 20],
  ['PER', 'Peripherals', 'Logitech MX Master 3S', 100, 20],
  ['PER', 'Peripherals', 'Wired Keyboard', 25, 40],
  ['PER', 'Peripherals', 'Optical Mouse', 12, 60],
  ['AUD', 'Audio & Video', 'Jabra Evolve2 65 Headset', 180, 15],
  ['AUD', 'Audio & Video', 'Logitech C920 Webcam', 70, 15],
  ['MOB', 'Mobile Devices', 'iPhone 15 (loaner)', 800, 5],
  ['MOB', 'Mobile Devices', 'Android test device', 350, 8],
  ['NET', 'Networking', '24-port PoE switch', 950, 3],
  ['NET', 'Networking', 'Wi-Fi 6 access point', 210, 6],
  ['SEC', 'Security & Access', 'RFID access badge (pack of 50)', 150, 4],
  ['SEC', 'Security & Access', 'Cable lock', 15, 50],
  ['OFF', 'Office Supplies', 'A4 paper (case of 5 reams)', 30, 25],
  ['OFF', 'Office Supplies', 'Whiteboard markers (box of 12)', 14, 20],
  ['OFF', 'Office Supplies', 'Sticky notes (12-pack)', 8, 30],
]

const counters = {}
const items = []
CATALOG.forEach(([prefix, category, name, unitCost, reorderLevel], index) => {
  counters[prefix] = (counters[prefix] || 0) + 1
  const sku = `${prefix}-${String(counters[prefix]).padStart(3, '0')}`
  const a = index % 4
  const b = (a + 1 + (index % 3)) % 4 // always a different location than `a`
  ;[a, b].forEach((li, n) => {
    const loc = LOCATIONS[li]
    let qty = Math.round(reorderLevel * (0.15 + rand() * 3.2))
    if (rand() < 0.07) qty = 0
    items.push({
      id: `${sku}@${loc.code}`,
      sku,
      name,
      category,
      location: loc.name,
      qty,
      reorderLevel,
      unitCost,
      supplier: SUPPLIERS[(index + n) % SUPPLIERS.length],
      lastRestocked: iso(new Date(TODAY.getTime() - Math.floor(rand() * 90) * DAY)),
    })
  })
})
items.sort((x, y) => x.sku.localeCompare(y.sku) || x.location.localeCompare(y.location))

const weeks = []
for (let i = 11; i >= 0; i--) {
  weeks.push({
    weekStart: iso(new Date(TODAY.getTime() - (i + 1) * 7 * DAY)),
    inbound: 160 + Math.round(rand() * 140) + (i % 4 === 0 ? 50 : 0),
    outbound: 140 + Math.round(rand() * 130),
  })
}

mkdirSync(outDir, { recursive: true })
writeFileSync(
  path.join(outDir, 'inventory.json'),
  JSON.stringify({
    generatedAt: iso(TODAY),
    currency: 'USD',
    note: 'FICTIONAL sample data for a demo — not real inventory.',
    locations: LOCATIONS,
    items,
  }, null, 2) + '\n'
)
writeFileSync(
  path.join(outDir, 'movements.json'),
  JSON.stringify({ generatedAt: iso(TODAY), unit: 'units', weeks }, null, 2) + '\n'
)
console.log(`wrote ${items.length} items and ${weeks.length} weeks of movements → ${outDir}`)
