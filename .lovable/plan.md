

# Bug Fixes and Feature Updates

## 1. Add Password Preview Toggle (AuthPage)

Add an eye/eye-off icon button inside the password input field so users can toggle between hidden and visible password text before submitting.

**File:** `src/pages/AuthPage.tsx`
- Add `showPassword` state
- Add `Eye`/`EyeOff` icons from lucide-react
- Change input type dynamically between "password" and "text"
- Position the toggle button inside the input field with absolute positioning

## 2. Fix: Onboarding Session Persistence

The onboarding flow doesn't persist progress. If the user loses connection or the page refreshes mid-onboarding, they start over. 

**File:** `src/pages/OnboardingPage.tsx`
- Save the current step and selections to `sessionStorage` after each step advance
- On mount, restore from `sessionStorage` if data exists
- Clear `sessionStorage` on completion

## 3. Multi-Chip Selection in Chatbot

Currently, clicking a chip immediately sends it as a message. Instead, allow users to select multiple chips, then send them all at once.

**File:** `src/pages/ChatPage.tsx`
- Add `selectedChips` state to track which chips are toggled on
- Change chip click behavior to toggle selection (highlight selected chips)
- Add a "Send" button that appears when chips are selected, sending them as a comma-joined message
- Keep the option to just type and send normally

## 4. Fix: Intake Chat Loading Another User's Chat

The `sessionStorage` key `buddy_chat_session` is not scoped to the user. If someone logs out and another logs in on the same browser tab, they see the previous user's chat. The same applies to the intake chat which has no session isolation.

**Files:** `src/pages/ChatPage.tsx`
- Scope the `STORAGE_KEY` to include the user ID so each user gets their own session
- Clear chat session on logout/user change

**File:** `src/contexts/AuthContext.tsx` (if needed)
- Ensure user ID is accessible for scoping

## 5. Fix: Dead Article Links

The articles are AI-generated with search-query URLs (e.g., `mayoclinic.org/search/search-results?q=...`). These are search page links, not direct article links, and some search pages may not return relevant results.

**File:** `supabase/functions/search-articles/index.ts`
- Update the system prompt to instruct the AI to generate titles that closely match real, well-known articles on those sites (improving search result quality)
- Add a note in the article card UI that these link to search results

**File:** `src/pages/ArticlesPage.tsx`
- Add subtle helper text like "Opens search results on source site" so users aren't surprised by landing on a search page instead of a direct article

## 6. Trevor Project: Combine Call and Text on Same Line

Currently "Trevor Project" call and "Trevor Project Text Line" are separate cards. Combine them into one card with both Call and Text buttons.

**File:** `src/components/CrisisSheet.tsx`
- Merge the Trevor Project entries into a single object with both `phone` and `sms` properties
- Render both Call and Text buttons side-by-side within one card

## 7. Fix: Double X Buttons on Report Sheet

The `SheetContent` component (from `sheet.tsx`) automatically renders a close X button (line 60-63). The WeeklyPage report sheet ALSO adds its own X button (line 781-783). This creates two X buttons.

**File:** `src/pages/WeeklyPage.tsx`
- Remove the manually-added X button from the report sheet header since `SheetContent` already provides one

## 8. Remove Doctor Reporting from Daily Log Screen

The `EntryDetailView` in `LogPage.tsx` has "Doctor report sharing" toggles (lines 360-370). Remove this section since reporting belongs in the Reports page.

**File:** `src/pages/LogPage.tsx`
- Remove the "Doctor report sharing" toggle section from `EntryDetailView`

## 9. Fix: Duplicate Log Entries from Chat Session Bleed

Because the chat session wasn't user-scoped (issue #4), entries may have been saved to the wrong user. The fix in item #4 prevents future occurrences. For existing duplicate entries:

**File:** `src/pages/LogPage.tsx`
- The entries query already filters by RLS (user_id), so other users' entries shouldn't appear
- The real fix is in #4 (scoping the chat session to user ID) which prevents the AI from generating `[ENTRY_SAVE]` blocks in a cross-user session context

No additional database changes needed -- RLS policies already protect entries by user_id.

## Technical Summary

| Item | File(s) | Type |
|------|---------|------|
| 1 | AuthPage.tsx | Feature |
| 2 | OnboardingPage.tsx | Bug fix |
| 3 | ChatPage.tsx | Feature |
| 4 | ChatPage.tsx | Bug fix |
| 5 | search-articles/index.ts, ArticlesPage.tsx | Bug fix |
| 6 | CrisisSheet.tsx | UI fix |
| 7 | WeeklyPage.tsx | Bug fix |
| 8 | LogPage.tsx | UI change |
| 9 | ChatPage.tsx (via #4) | Bug fix |

