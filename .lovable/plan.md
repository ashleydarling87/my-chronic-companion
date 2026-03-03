

## Update Color Scheme

### Overview
Replace all current color token values in `src/index.css` with the new palette. The existing codebase uses HSL triplets (e.g., `12 76% 68%`) consumed via `hsl(var(--primary))` in Tailwind. The new scheme is provided in hex, so values will be converted to HSL format to maintain compatibility. The theme attribute stays as `class` (`.dark`) since that's how `next-themes` is configured.

### Hex-to-HSL Conversion Reference

| Token | Light (hex) | Light (HSL) | Dark (hex) | Dark (HSL) |
|-------|------------|-------------|-----------|------------|
| background | #F7F1E7 | 37 52% 94% | #1A1415 | 350 10% 9% |
| foreground | #241B1D | 350 16% 12% | #F7F1E7 | 37 52% 94% |
| card | #FFFFFF | 0 0% 100% | #241B1D | 350 16% 12% |
| primary | #FF8A72 | 11 100% 72% | #FF8A72 | 11 100% 72% |
| primary-fg | #301617 | 356 36% 14% | #1A1415 | 350 10% 9% |
| secondary | #E2D7DE | 327 14% 86% | #3B292C | 349 19% 20% |
| muted | #E2D7DE | 327 14% 86% | #3B292C | 349 19% 20% |
| muted-fg | #4C3A3D | 350 14% 26% | #C8BDC4 | 322 7% 76% |
| accent | #4FB7A8 | 170 39% 51% | #4FB7A8 | 170 39% 51% |
| accent-fg | #123730 | 170 51% 14% | #1A1415 | 350 10% 9% |
| destructive | #FF6B81 | 351 100% 71% | #FF6B81 | 351 100% 71% |
| destructive-fg | #3D151C | 351 48% 16% | #1A1415 | 350 10% 9% |
| border/input | #E2D7DE | 327 14% 86% | #3B292C | 349 19% 20% |
| ring | #FF8A72 | 11 100% 72% | #FF8A72 | 11 100% 72% |
| energy-high/pain-low | #4FB7A8 | 170 39% 51% | same | same |
| energy-mid/pain-mid | #FFC861 | 39 100% 69% | same | same |
| energy-low/pain-high | #FF6B81 | 351 100% 71% | same | same |
| chat-user | #FF8A72 | 11 100% 72% | same | same |
| chat-user-fg | #301617 | 356 36% 14% | #1A1415 | 350 10% 9% |
| chat-ai | #E2D7DE | 327 14% 86% | #3B292C | 349 19% 20% |
| chat-ai-fg | #241B1D | 350 16% 12% | #F7F1E7 | 37 52% 94% |

### File Changes

**`src/index.css`** -- Replace all HSL values in both `:root` (light) and `.dark` blocks with the converted values above. This includes core tokens, chat tokens, energy/pain tokens, and sidebar tokens. No structural changes needed -- just swapping color values.

### What stays the same
- HSL triplet format (required by Tailwind's `hsl(var(...))` pattern)
- `.dark` class selector (used by `next-themes` with `attribute="class"`)
- `tailwind.config.ts` -- no changes needed
- All component files -- no changes needed

