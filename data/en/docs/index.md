---
title: App.Docs.Title
description: App.Docs.Subtitle
layout: Doc
---

# Documentation

Welcome to the NaN0Web Runner documentation. This engine is built on the **OLMUI Triad** principle:

1. **One Logic**: The core state machine and business rules are shared.
2. **Many UI**: Different adapters (CLI, Web, Chat) render the same data.

## Getting Started

To run your own app through the runner:

```bash
nan0web run --dsn data/
```

## Data Structure

Each app consists of:
- `_ / t.nan0` — Translations.
- `_ / nav.nan0` — Navigation tree.
- `index.nan0` — Main entry point.
