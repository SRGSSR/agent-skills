# 1. Postgres for article storage

Date: 2024-11-12
Status: accepted

## Context
The prototype kept articles in memory. The mobile app needs stable IDs and the archive import brings about 200k articles.

## Decision
Store articles in Postgres, with plain SQL migrations in `migrations/` applied in order at startup.

## Consequences
Migrations that already ran in production are never edited; changes go in a new migration.
