# PAGEONE Complete Cover Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete PAGEONE's cover workspace so every visible control edits the cover, AI and Canva images fit the selected print specification, and users can export a 300 DPI PNG or exact-size PDF.

**Architecture:** Keep the existing single-page product and API routes, but move deterministic cover math into a small browser/Node-compatible module. The editor stores presentation state in React, renders the same state to the on-screen spread and a high-resolution canvas, and feeds that canvas to PNG/PDF export.

**Tech Stack:** React 19, TypeScript, vinext, Canvas 2D, pdf-lib, Node test runner, Cloudflare Sites.

## Global Constraints

- Trim sizes: 46판 127×188mm, A5 148×210mm, B5 182×257mm, A4 210×297mm.
- Spine width: `pageCount × 0.055 + 1.6`mm for 50–300 pages.
- Print assets: 3mm bleed at 300 DPI.
- Spine title and optional author are centered and visually separated.
- Canva is an external workflow: copy the exact brief, work in Canva, then import the exported image.
- API keys stay in session storage and support test, save, and delete.

---

### Task 1: Cover specification contract

**Files:** Create `app/lib/cover-spec.mjs`, create `tests/cover-spec.test.mjs`, modify `tests/rendered-html.test.mjs`.

**Interfaces:** Produces `calculateSpineWidth(pageCount)`, `calculateCoverSpec(options)`, `clampZoom(value)`, and `validateImportedImage(input)`.

- [ ] Write tests for spine examples, spread pixels, zoom limits, and image warnings.
- [ ] Run `node --test tests/cover-spec.test.mjs`; expect failure because the module is absent.
- [ ] Implement the pure functions and rerun until green.

### Task 2: Working editor controls

**Files:** Modify `app/page.tsx`, `app/globals.css`; test `tests/rendered-html.test.mjs`.

**Interfaces:** Consumes the specification contract; produces separate zoom actions, selectable text layers, font/size/color/alignment controls, and background scale/position controls.

- [ ] Add failing assertions for accessible zoom, editor labels, and export actions.
- [ ] Wire each toolbar control to a real editor panel and reflect state in the spread.
- [ ] Re-run source tests and lint.

### Task 3: Exact-size AI and Canva pipeline

**Files:** Modify `app/page.tsx`, `app/api/ai/cover/route.ts`; test `tests/cover-spec.test.mjs`.

**Interfaces:** Consumes provider/import image; produces an exact 300 DPI full-spread data URL with validation status.

- [ ] Update OpenAI to `gpt-image-1`, Gemini to a 4K image configuration, and Claude to a supported Sonnet model for art direction.
- [ ] Normalize generated/imported images to the calculated canvas before applying them.
- [ ] Keep multi-megabyte images out of localStorage.

### Task 4: Print export

**Files:** Modify `package.json`, `package-lock.json`, `app/page.tsx`; test `tests/rendered-html.test.mjs`.

**Interfaces:** Consumes current editor state; produces 300 DPI PNG and a one-page exact-size PDF.

- [ ] Add failing assertions for PNG and PDF export.
- [ ] Install `pdf-lib`, render the cover once at full resolution, and use it for both downloads.
- [ ] Set the PDF media box with `mm × 72 / 25.4` points.

### Task 5: Verify and publish

**Files:** Modify `.openai/hosting.json` only if required by hosting.

- [ ] Run `node --test tests/*.test.mjs`, `npm run lint`, and `npm run build` with zero failures.
- [ ] Review requirements and diff, commit the validated source, deploy privately, and wait for success.

