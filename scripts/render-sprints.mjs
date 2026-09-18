#!/usr/bin/env node
// Renders docs/SPRINTS.md from sprints.json (the single source of truth).
// Run: npm run sprints

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const plan = JSON.parse(readFileSync(path.join(root, 'sprints.json'), 'utf8'))

const lines = [
  `# Sprint plan — ${plan.project}`,
  '',
  '> Generated from `sprints.json` by `npm run sprints` — edit the JSON, not this file.',
  '> Each task is one coord `post_task`: **title** → title, **needs** → needs, **details** → details.',
  '',
]

for (const s of plan.sprints) {
  lines.push(`## Sprint ${s.id} — ${s.name}`, '', `**Goal:** ${s.goal}`, '')
  for (const t of s.tasks) {
    lines.push(`### ${t.title}`, '', `**needs:** ${t.needs.map((n) => `\`${n}\``).join(', ')}`, '')
    lines.push(...t.details.split('\n'), '')
  }
}

mkdirSync(path.join(root, 'docs'), { recursive: true })
writeFileSync(path.join(root, 'docs', 'SPRINTS.md'), lines.join('\n'))
const count = plan.sprints.reduce((n, s) => n + s.tasks.length, 0)
console.log(`rendered docs/SPRINTS.md — ${plan.sprints.length} sprints, ${count} tasks`)
