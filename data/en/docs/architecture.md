---
title: App.Menu.Architecture
layout: Doc
---

# Architecture

The **NaN0Web Engine** is a sovereign runtime that turns data structures into interactive interfaces.

## Core Concepts

- **Model-as-Schema**: The source of truth for all forms and data models.
- **Intent Delegation**: The runner can delegate intents to sub-apps.
- **WebSocket Bridge**: Real-time state synchronization across all connected UIs.

## Sequence

1. `Runner.run()` -> discovers apps.
2. `IntentResolver` -> delegates user action.
3. `UI Adapters` -> render the view.
