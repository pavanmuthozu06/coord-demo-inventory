// Starts the real Express app on an ephemeral port and hits it over HTTP.

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../server/app.js'
import { loadInventory, computeKpis } from '../server/inventory.js'

let server
let base

before(async () => {
  server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})
after(() => new Promise((resolve) => server.close(resolve)))

const get = async (p) => {
  const res = await fetch(base + p)
  const type = res.headers.get('content-type') || ''
  return { status: res.status, body: type.includes('json') ? await res.json() : await res.text() }
}

test('GET /api/health', async () => {
  assert.deepEqual(await get('/api/health'), { status: 200, body: { ok: true } })
})

test('GET /api/kpis matches the pure computation', async () => {
  const { items } = await loadInventory()
  const { status, body } = await get('/api/kpis')
  assert.equal(status, 200)
  assert.deepEqual(body, computeKpis(items))
})

test('GET /api/items returns every row with a status', async () => {
  const { items } = await loadInventory()
  const { status, body } = await get('/api/items')
  assert.equal(status, 200)
  assert.equal(body.total, items.length)
  assert.equal(body.items.length, items.length)
  assert.ok(body.items.every((i) => ['ok', 'low', 'out'].includes(i.status)))
})

test('GET /api/categories is sorted by units, descending', async () => {
  const { body } = await get('/api/categories')
  assert.ok(body.length > 3)
  for (let i = 1; i < body.length; i++) assert.ok(body[i - 1].units >= body[i].units)
})

test('planned routes answer 501 and name the sprint task', async () => {
  const alerts = await get('/api/alerts')
  assert.equal(alerts.status, 501)
  assert.equal(alerts.body.task, 'S1-3')
  const movements = await get('/api/movements')
  assert.equal(movements.status, 501)
  assert.equal(movements.body.task, 'S2-1')
})

test('unknown /api route → 404 JSON; / serves the dashboard', async () => {
  const missing = await get('/api/nope')
  assert.equal(missing.status, 404)
  assert.equal(missing.body.error, 'not_found')
  const home = await get('/')
  assert.equal(home.status, 200)
  assert.match(home.body, /Inventory Dashboard/)
})
