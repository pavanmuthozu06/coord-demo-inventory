// Inventory data access + pure logic. No Express in here, so it is trivial to
// unit-test. Tasks S1-2 (query), S1-3 (alerts), S2-3 (locations), S3-1 (csv) add
// their pure functions next to these.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
export const DEFAULT_DATA_DIR = path.join(here, '..', 'data')

export async function loadInventory(dataDir = DEFAULT_DATA_DIR) {
  return JSON.parse(await readFile(path.join(dataDir, 'inventory.json'), 'utf8'))
}

/** 'out' (qty 0) | 'low' (at or below the reorder level) | 'ok' */
export function stockStatus(item) {
  if (item.qty <= 0) return 'out'
  if (item.qty <= item.reorderLevel) return 'low'
  return 'ok'
}

export const withStatus = (items) => items.map((item) => ({ ...item, status: stockStatus(item) }))

export function computeKpis(items) {
  return {
    totalSkus: items.length,
    units: items.reduce((sum, i) => sum + i.qty, 0),
    value: items.reduce((sum, i) => sum + i.qty * i.unitCost, 0),
    // "low" includes out-of-stock: anything at or below its reorder level
    lowStock: items.filter((i) => i.qty <= i.reorderLevel).length,
    outOfStock: items.filter((i) => i.qty <= 0).length,
    locations: new Set(items.map((i) => i.location)).size,
  }
}

/** Units, SKU count and value per category, largest (by units) first. */
export function byCategory(items) {
  const map = new Map()
  for (const item of items) {
    const row = map.get(item.category) || { category: item.category, skus: 0, units: 0, value: 0 }
    row.skus += 1
    row.units += item.qty
    row.value += item.qty * item.unitCost
    map.set(item.category, row)
  }
  return [...map.values()].sort((a, b) => b.units - a.units)
}
