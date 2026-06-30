# ADR-008: Tauri Desktop

Status: Accepted  
Date: 2026-06-30

## Context

CareerOS needs a lightweight desktop app for Windows and future cross-platform support.

## Decision

Use Tauri as the preferred desktop framework.

## Consequences

- Lower resource usage than Electron.
- Requires Rust/Tauri build toolchain.
- Good fit for local-first app shell.
