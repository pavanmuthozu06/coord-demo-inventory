// The Express app, built by a factory so tests can start it on an ephemeral port.

import express from 'express'
import path from 'node:path'
import url from 'node:url'
import { loadInventory, withStatus, computeKpis, byCategory, DEFAULT_DATA_DIR } from './inventory.js'

const here = path.dirname(url.fileURLToPath(import.meta.url))

// Wrap async handlers so a rejected promise reaches the error handler (Express 4 and 5).
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

// Routes that are planned but not built yet answer 501 and name the sprint task.
const notImplemented = (task, what) => (req, res) =>
  res.status(501).json({ error: 'not_implemented', task, message: `${what} is not built yet (${task})` })

export function createApp({ dataDir = DEFAULT_DATA_DIR } = {}) {
  const app = express()
  app.disable('x-powered-by')

  const load = () => loadInventory(dataDir) // re-read per request: fine for a demo

  app.get('/api/health', (req, res) => res.json({ ok: true }))

  // TODO(S1-2): add q / location / category / sort / dir / page / pageSize
  app.get('/api/items', wrap(async (req, res) => {
    const inv = await load()
    res.json({ generatedAt: inv.generatedAt, total: inv.items.length, items: withStatus(inv.items) })
  }))

  app.get('/api/kpis', wrap(async (req, res) => res.json(computeKpis((await load()).items))))
  app.get('/api/categories', wrap(async (req, res) => res.json(byCategory((await load()).items))))

  // Planned, not built:
  app.get('/api/alerts', notImplemented('S1-3', 'Low-stock alerts'))
  app.get('/api/movements', notImplemented('S2-1', 'Stock movement trend'))
  // S2-2 /api/reorders · S2-3 /api/locations · S3-1 /api/items.csv

  app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }))
  app.use(express.static(path.join(here, '..', 'public')))

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  })
  return app
}
