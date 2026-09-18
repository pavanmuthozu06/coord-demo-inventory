// Keeps sprints.json (the manager's posting list) well-formed.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const plan = JSON.parse(await readFile(new URL('../sprints.json', import.meta.url), 'utf8'))

test('3 sprints of 3 tasks each, with unique ids in S<sprint>-<n> form', () => {
  assert.equal(plan.sprints.length, 3)
  const ids = new Set()
  for (const s of plan.sprints) {
    assert.equal(s.tasks.length, 3, `sprint ${s.id} should have 3 tasks`)
    for (const [n, t] of s.tasks.entries()) {
      assert.equal(t.id, `S${s.id}-${n + 1}`)
      assert.ok(!ids.has(t.id), `duplicate ${t.id}`)
      ids.add(t.id)
    }
  }
})

test('every task is postable: tagged title, sprint tag in needs, real details', () => {
  for (const s of plan.sprints) {
    for (const t of s.tasks) {
      assert.ok(t.title.startsWith(`[${t.id}] `), `${t.id}: title must start with its id`)
      assert.ok(t.needs.includes(`sprint-${s.id}`), `${t.id}: needs must include sprint-${s.id}`)
      assert.ok(t.details.length > 120, `${t.id}: details too thin`)
    }
  }
})

test('the first task of sprint 1 is the Altimetrik UI styling task', () => {
  const first = plan.sprints[0].tasks[0]
  assert.match(first.title, /Altimetrik UI styling/)
  assert.match(first.details, /await_input/) // brand assets are an explicit human-gate input
})
