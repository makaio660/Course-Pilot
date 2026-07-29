# CoursePilot Chrome Extension MVP

This folder is a Manifest V3 Chrome extension version of CoursePilot. It keeps the MVP read-only and auto-links from a logged-in Canvas browser tab. It now supports standard `*.instructure.com` URLs and school-custom Canvas domains by detecting Canvas page structure.

## Load locally

1. Open Chrome and go to `chrome://extensions`.
2. Turn on Developer Mode.
3. Choose **Load unpacked**.
4. Select `/Users/jonathanfadollone/Documents/School work/extension`.
5. Pin CoursePilot from the extensions menu.

## What it includes

- Popup dashboard with Focus, Quick Wins, and Grades tabs.
- Canvas content script for standard Canvas and school-custom Canvas pages.
- Automatic Canvas base URL detection from any open Canvas tab.
- Background auto-sync every few minutes, plus refresh-on-tab-load when Canvas opens.
- Logged-in Canvas API scan for planner items, upcoming events, courses, and assignments when available.
- Visible Canvas assignment-link fallback with direct “Open in Canvas” links.
- Local scan snapshot stored in Chrome extension storage.
- Options page for alert sensitivity, digest preferences, Canvas URL, and grade settings.

## Next integration step

Add a Canvas OAuth developer key for background syncing when Canvas is not open. Keep hidden Canvas grade totals labeled as estimates only.
