

## Making CozyZebra Feel Genuinely Cozy

This is a large set of visual, interaction, and copy changes. I'll break it into manageable implementation phases, prioritizing the changes that have the most impact with the least risk of breaking existing functionality.

### Phase 1: Visual Warmth & Texture

**Grain overlay on backgrounds** (`src/index.css`)
- Add a CSS `::before` pseudo-element on `body` with a subtle SVG noise texture at 1-2% opacity, `pointer-events: none`, fixed position covering the viewport.

**Soft inner shadows on cards** (`src/index.css` + `src/components/ui/card.tsx`)
- Replace the default `shadow-sm` border style on cards with `shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]` and soften borders to `border-border/50`.
- Apply the same treatment to all `rounded-2xl border bg-card` containers across pages.

**Rounder everything** (`tailwind.config.ts`)
- Bump `--radius` from `1rem` to `1.25rem` in CSS variables.
- Ensure chips, buttons, inputs all use `rounded-2xl` or `rounded-full` consistently. Audit and bump any `rounded-xl` inputs/selects to `rounded-2xl`.

**Warm CTA glow** (`src/index.css`)
- Add a utility class `.cta-glow` that applies a subtle `box-shadow: 0 0 20px hsl(var(--primary) / 0.15)` on primary action buttons (submit, send, save).

**No pure black in dark mode**
- The current dark background `350 10% 9%` (~`#1A1415`) is already warm. Verify no `#000` or `#000000` is used in component code — the search confirms it's only in the Tailwind config defaults (which is fine, they're not actively used).

### Phase 2: Copy & Language Tweaks

**Time-of-day greetings** (`src/pages/ChatPage.tsx`)
- Already partially implemented with `timeGreeting`. Enhance with more personality:
  - Before 5 AM: "Hey, night owl 🌙"
  - 5-11 AM: "Good morning ☀️"
  - 12-16: "Good afternoon ☕"
  - 17-20: "Good evening 🌅"
  - After 20: "Winding down? 🛏️"

**Low-energy mode language** (`src/pages/ChatPage.tsx`)
- When `hasExistingEntry` is true AND user returns, use shorter, gentler prompts in `makeInitialMessage`. The existing "return" path already does this somewhat — refine the chips to be shorter: "Rough one? Tap to note anything, or just rest."

**Emoji section markers** — Replace lucide icons with emoji in key headers:
- Resources page categories already use emoji ✓
- Weekly/Reports page: "🦓 Buddy's Take" → use dynamic buddy emoji (fix hardcoded 🐻)
- Log page: fix hardcoded 🐻 references to use `getBuddyEmoji()`
- Summary page: fix "🐻 Buddy asks..." → use dynamic buddy emoji
- Mindfulness page: fix hardcoded 🐻 → use dynamic buddy emoji
- Articles page: fix hardcoded 🐻 → use dynamic buddy emoji

### Phase 3: Typing Indicator Upgrade

**Accent teal pulsing dots** (`src/pages/ChatPage.tsx`)
- Change the `TypingIndicator` from bouncing gray dots to gently pulsing dots in the accent color (`bg-accent`). Use the existing `typing-dot` animation (already defined in tailwind config) instead of `animate-bounce` for a softer feel.

### Phase 4: Celebration Without Pressure

**Warm glow on streak** (`src/pages/ChatPage.tsx`)
- After saving a check-in, if the user has logged 3+ days in a row, show a brief inline message below the saved indicator: "Your zebra remembers all of this for you 🦓✨" with a subtle warm glow animation. No streak counters or guilt.
- This requires a quick count query on `entries` for consecutive days.

### Phase 5: Spacing & Layout Comfort

**Generous padding** — Audit all pages:
- Increase `space-y-3` to `space-y-4` on main content areas
- Increase card internal padding from `p-4` to `p-5` where content feels cramped
- Ensure chat bubbles have comfortable spacing

### Phase 6: Sound (Optional, Marked for Future)

Sound effects (log-complete chime, notification tones) require audio assets and are best deferred. I'll add a placeholder infrastructure comment but won't implement audio files in this pass.

### Phase 7: Illustrations (Deferred)

Custom spot illustrations (striped mug, heating pad) require design assets. Out of scope for code changes but the empty-state containers are already structured to accept them.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Grain overlay, soft card shadows utility, CTA glow utility |
| `tailwind.config.ts` | Bump radius, verify no pure-black usage |
| `src/components/ui/card.tsx` | Soft inner shadow, softer border |
| `src/pages/ChatPage.tsx` | Enhanced time greetings, low-energy copy, accent typing dots, streak celebration |
| `src/pages/WeeklyPage.tsx` | Replace hardcoded 🐻 with dynamic buddy emoji |
| `src/pages/LogPage.tsx` | Replace hardcoded 🐻 with dynamic buddy emoji |
| `src/pages/SummaryPage.tsx` | Replace hardcoded 🐻 with dynamic buddy emoji |
| `src/pages/MindfulnessPage.tsx` | Replace hardcoded 🐻 with dynamic buddy emoji |
| `src/pages/ArticlesPage.tsx` | Replace hardcoded 🐻 with dynamic buddy emoji |
| `src/pages/ProfilePage.tsx` | Rounder inputs, CTA glow on save button |

### What's Deferred
- Haptic feedback (requires native APIs, not available in web without PWA)
- Sound effects (needs audio assets)
- Custom illustrations (needs design assets)
- "One action per screen" journal flow (structural redesign, separate task)

