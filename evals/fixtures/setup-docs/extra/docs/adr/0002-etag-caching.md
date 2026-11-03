# 2. ETag caching for article lists

Date: 2025-06-17
Status: accepted

## Context
The mobile app polls the article list every minute; most responses are unchanged.

## Decision
Weak ETags computed from the newest `updatedAt` and the query, `304 Not Modified` when they match. No server-side cache.

## Consequences
Every list endpoint must include `updatedAt` in its query, or the ETag goes stale.
