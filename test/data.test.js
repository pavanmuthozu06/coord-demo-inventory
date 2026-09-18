// Guards the mock dataset the demo (and the sprint tasks) rely on.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadInventory, stockStatus } from '../server/inventory.js'
import { readFile } from 'node:fs/promises'

test('inventory.json is well-formed with unique ids and known locations', async () => {
  const inv = await loadInventory()
  assert.ok(inv.items.length >= 40, 'enough rows to make the table interesting')
  const ids = new Set()
  const locations = new Set(inv.locations.map((l) => l.name))
  for (const i of inv.items) {
    for (const f of ['id', 'sku', 'name', 'category', 'location', 'supplier', 'lastRestocked']) {
      assert.equal(typeof i[f], 'string', `${i.id}: ${f} must be a string`)
    }
    for (const f of ['qty', 'reorderLevel', 'unitCost']) {
      assert.ok(Number.isFinite(i[f]) && i[f] >= 0, `${i.id}: ${f} must be a non-negative number`)
    }
    assert.ok(locations.has(i.location), `${i.id}: unknown location ${i.location}`)
    assert.ok(!ids.has(i.id), `duplicate id ${i.id}`)
    ids.add(i.id)
  }
})

test('the dataset has enough low / out-of-stock rows to exercise the alerts panel', async () => {
  const { items } = await loadInventory()
  const low = items.filter((i) => stockStatus(i) === 'low').length
  const out = items.filter((i) => stockStatus(i) === 'out').length
  assert.ok(low >= 5, `expected >=5 low-stock rows, got ${low}`)
  assert.ok(out >= 1, `expected >=1 out-of-stock row, got ${out}`)
})

test('movements.json has 12 weekly rows in chronological order', async () => {
  const m = JSON.parse(await readFile(new URL('../data/movements.json', import.meta.url), 'utf8'))
  assert.equal(m.weeks.length, 12)
  const starts = m.weeks.map((w) => w.weekStart)
  assert.deepEqual(starts, [...starts].sort())
  for (const w of m.weeks) assert.ok(w.inbound > 0 && w.outbound > 0)
})
