

# Add Dark/Light Mode Toggle and Remove Sharing Defaults

## 1. Add Dark Theme CSS Variables

**File:** `src/index.css`

Add a `.dark` class block with dark-mode color values for all CSS custom properties (background, foreground, card, primary, secondary, muted, accent, destructive, border, chat colors, energy/pain scales, sidebar).

## 2. Wrap App with ThemeProvider

**File:** `src/App.tsx`

Import `ThemeProvider` from `next-themes` and wrap the app content so theme toggling works. Set `attribute="class"` to match the Tailwind `darkMode: ["class"]` config, and `defaultTheme="system"` so it respects the user's OS preference.

## 3. Add Theme Toggle to Profile Page

**File:** `src/pages/ProfilePage.tsx`

Add a new "Appearance" section in the Settings area with three options (Light, Dark, System) using `useTheme()` from `next-themes`. Display them as selectable buttons or a simple select dropdown, styled consistently with the existing profile sections.

## 4. Remove Sharing Defaults from PainPreferencesCard

**File:** `src/components/PainPreferencesCard.tsx`

Remove the "Sharing defaults for doctor reports" section (the two checkboxes for "Include notes about discrimination" and "Include emotional and spiritual impact"). These controls already exist in the doctor reporting section (WeeklyPage). Also remove the related state variables (`includeDiscrimination`, `includeEmotional`) and their references in the save handler.

---

### Technical Details

**Dark theme colors** will be warm-toned to match the existing light palette:
- Background: dark warm gray (~20 15% 12%)
- Cards: slightly lighter (~20 12% 16%)
- Primary: same coral hue, slightly adjusted for contrast
- Text: light warm tones

**ThemeProvider config:**
```text
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  ...existing app content...
</ThemeProvider>
```

**Profile toggle** will use `useTheme()` hook with `setTheme()` for Light/Dark/System options rendered as pill buttons in a new "Appearance" card above the existing Settings section.

