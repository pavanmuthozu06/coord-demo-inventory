// Browser code (no build step). Fetches from the Node API and renders the dashboard.

const $ = (sel) => document.querySelector(sel)
const fmtInt = (n) => new Intl.NumberFormat('en-US').format(n)
const fmtMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const PAGE_SIZE = 15 // TODO(S1-2): replace with server-side search / sort / filter / pagination

function h(tag, props = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') el.className = value
    else el.setAttribute(key, value)
  }
  for (const child of children.flat()) el.append(child instanceof Node ? child : document.createTextNode(String(child)))
  return el
}

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

function renderKpis(k) {
  const cards = [
    ['Total SKUs', fmtInt(k.totalSkus), `across ${k.locations} locations`],
    ['Units on hand', fmtInt(k.units), 'all locations'],
    ['Inventory value', fmtMoney(k.value), 'at unit cost'],
    ['Low stock', fmtInt(k.lowStock), `${k.outOfStock} out of stock`],
  ]
  $('#kpis').replaceChildren(
    ...cards.map(([label, value, hint]) =>
      h('div', { class: 'kpi' },
        h('div', { class: 'kpi-label' }, label),
        h('div', { class: 'kpi-value' }, value),
        h('div', { class: 'kpi-hint' }, hint)))
  )
}

function renderCategories(rows) {
  const max = Math.max(...rows.map((r) => r.units), 1)
  $('#category-chart').replaceChildren(
    ...rows.map((r) =>
      h('div', { class: 'bar-row' },
        h('div', { class: 'bar-label' }, r.category),
        h('div', { class: 'bar-track' },
          h('div', { class: 'bar-fill', style: `width:${(r.units / max) * 100}%` })),
        h('div', { class: 'bar-value' }, fmtInt(r.units))))
  )
}

const STATUS_LABEL = { ok: 'In stock', low: 'Low', out: 'Out' }

function renderTable(items, total) {
  const columns = [
    ['SKU', (i) => i.sku], ['Name', (i) => i.name], ['Category', (i) => i.category],
    ['Location', (i) => i.location], ['Qty', (i) => fmtInt(i.qty), 'num'],
    ['Reorder at', (i) => fmtInt(i.reorderLevel), 'num'], ['Unit cost', (i) => fmtMoney(i.unitCost), 'num'],
  ]
  const shown = items.slice(0, PAGE_SIZE)
  const table = h('table', { class: 'inv' },
    h('thead', {}, h('tr', {},
      ...columns.map(([label, , cls]) => h('th', { scope: 'col', class: cls || '' }, label)),
      h('th', { scope: 'col' }, 'Status'))),
    h('tbody', {}, ...shown.map((item) =>
      h('tr', {},
        ...columns.map(([, get, cls]) => h('td', { class: cls || '' }, get(item))),
        h('td', {}, h('span', { class: `badge badge--${item.status}` }, STATUS_LABEL[item.status]))))))
  $('#table-wrap').replaceChildren(table)
  $('#table-note').textContent = `Showing ${shown.length} of ${total} rows — search, sort, filters and paging arrive in S1-2.`
}

async function main() {
  try {
    const [kpis, categories, inv] = await Promise.all([
      getJson('/api/kpis'), getJson('/api/categories'), getJson('/api/items'),
    ])
    $('#updated').textContent = inv.generatedAt
    renderKpis(kpis)
    renderCategories(categories)
    renderTable(inv.items, inv.total)
  } catch (err) {
    const box = $('#error')
    box.hidden = false
    box.textContent = `Could not load inventory data: ${err.message}`
  }
}

main()
