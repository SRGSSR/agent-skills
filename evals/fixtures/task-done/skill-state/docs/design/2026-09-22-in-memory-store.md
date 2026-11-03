# In-memory item store

- Date: 2026-09-22
- Status: accepted (prototype)
- Scope: `server.js`

## Why
The prototype must run for Friday's demo with no setup on the presenter's laptop.

## Decisions
- Items live in an array in `server.js` and are lost on restart; the demo seeds three items.

## Alternatives discarded
- SQLite: one more dependency and a file to manage, for a demo that restarts anyway.
