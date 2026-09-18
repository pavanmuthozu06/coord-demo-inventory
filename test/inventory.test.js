import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stockStatus, withStatus, computeKpis, byCategory } from '../server/inventory.js'

const item = (over = {}) => ({
  id: 'X-001@BLR', sku: 'X-001', name: 'Thing', category: 'Cat', location: 'Bengaluru',
  qty: 10, reorderLevel: 5, unitCost: 100, ...over,
})

test('stockStatus: out at 0, low at or below the reorder level, otherwise ok', () => {
  assert.equal(stockStatus(item({ qty: 0 })), 'out')
  assert.equal(stockStatus(item({ qty: 5, reorderLevel: 5 })), 'low')
  assert.equal(stockStatus(item({ qty: 6, reorderLevel: 5 })), 'ok')
  assert.equal(stockStatus(item({ qty: 1, reorderLevel: 5 })), 'low')
})

test('withStatus adds a status without mutating the input', () => {
  const src = [item({ qty: 0 })]
  const out = withStatus(src)
  assert.equal(out[0].status, 'out')
  assert.equal('status' in src[0], false)
})

test('computeKpis totals units/value and counts low + out of stock', () => {
  const k = computeKpis([
    item({ qty: 10, unitCost: 100 }),                       // ok
    item({ qty: 2, reorderLevel: 5, unitCost: 50 }),        // low
    item({ qty: 0, unitCost: 10, location: 'Chennai' }),    // out (also counts as low)
  ])
  assert.deepEqual(k, { totalSkus: 3, units: 12, value: 10 * 100 + 2 * 50, lowStock: 2, outOfStock: 1, locations: 2 })
})

test('byCategory aggregates per category, largest units first', () => {
  const rows = byCategory([
    item({ category: 'A', qty: 1, unitCost: 10 }),
    item({ category: 'B', qty: 9, unitCost: 1 }),
    item({ category: 'A', qty: 4, unitCost: 10 }),
  ])
  assert.deepEqual(rows.map((r) => r.category), ['B', 'A'])
  assert.deepEqual(rows[1], { category: 'A', skus: 2, units: 5, value: 50 })
})
