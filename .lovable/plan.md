

# Communication Composer -- AI-Powered Message Helper

## Overview
Replace the static advocacy resources list in the Communication section with a dedicated AI chat experience that helps users compose empowering messages to friends, family, healthcare providers, employers, and others about their health. The AI will help users communicate without shame or guilt, offering drafts, coaching, and reframing.

## How It Works
When a user taps "Communication" on the Resources page, instead of toggling the static advocacy card list, they'll navigate to a new `/resources/communication` page with a purpose-built chat interface. The user picks who they're writing to, describes the situation, and the AI helps them draft and refine a message they feel good about.

## New Files

### 1. `src/pages/CommunicationPage.tsx`
A full-page chat experience (similar to ChatPage but with a different system prompt and purpose):

- **Header**: "Communication Helper" with a back arrow to `/resources`
- **Audience picker**: On first load, show chip buttons to select the recipient type: "Doctor / Provider", "Boss / HR", "Friend", "Family", "Partner", "Other"
- **Situation prompt**: After picking the audience, show a brief text input or chip options for the situation: "Explaining my condition", "Requesting accommodations", "Setting boundaries", "Canceling plans", "Asking for help", "Other"
- **Chat interface**: Once context is set, the AI chat begins. The user describes what they want to say, and the AI helps them craft the message. The AI can:
  - Draft a message for them to copy/send
  - Reframe guilt-laden language into empowered language
  - Suggest ways to set boundaries
  - Help explain invisible illness / chronic conditions
  - Offer multiple tone options (formal, casual, firm, gentle)
- **Copy button**: On any AI-generated draft message, show a "Copy to clipboard" button
- **Bottom nav** stays visible

### 2. `src/lib/communicationChatStream.ts`
A thin wrapper around the existing `streamChat` function from `chatStream.ts`, but passing `mode: "communication"` so the edge function uses a different system prompt.

### 3. Update `supabase/functions/buddyChat/index.ts`
Add a new `mode === "communication"` branch with a dedicated system prompt:

**System prompt focus areas:**
- You are a communication coach helping someone with chronic pain/illness/mental health craft messages
- The user has selected an audience (doctor, boss, friend, family, partner) and a situation -- tailor advice accordingly
- Help them communicate without shame, guilt, or over-apologizing
- Reframe "I'm sorry I can't..." into "I need to take care of my health by..."
- Offer concrete draft messages they can copy and customize
- Be empowering, not pitying
- When drafting, present the message in a clear block format they can copy
- Suggest multiple versions if helpful (formal vs casual, brief vs detailed)
- Use the user's condition/symptoms context from preferences to make drafts specific and authentic
- Include CHIPS suggestions for next steps ("Make it shorter", "More formal", "Add more detail", "Try a different angle")

### 4. Update `src/pages/ResourcesPage.tsx`
Change the Communication button handler from toggling `showAdvocacy` to navigating to `/resources/communication`.

### 5. Update `src/App.tsx`
Add route: `/resources/communication` pointing to `CommunicationPage`.

## UI Flow

```text
Resources Page
    |
    v
[Tap "Communication"]
    |
    v
Communication Page
    |
    v
"Who are you writing to?"
[Doctor] [Boss] [Friend] [Family] [Partner] [Other]
    |
    v
"What's the situation?"
[Explaining condition] [Requesting accommodations] [Setting boundaries] [Canceling plans] [Asking for help]
    |
    v
Chat begins with AI context set.
User describes what they need to say.
AI drafts, refines, and empowers.
Copy button on draft messages.
```

## Technical Details

- Reuses existing `streamChat` infrastructure and `buddyChat` edge function (new mode branch)
- No new database tables needed -- this is a stateless chat helper (no persistence needed)
- Session storage can optionally cache the current conversation like ChatPage does
- The audience and situation selections are passed as part of the first message context to the AI
- User preferences (condition, symptoms, identity tags) are sent to the edge function for personalized drafts
- The "suggested for you" badge logic on ResourcesPage stays as-is (it still highlights Communication when relevant)
- Remove the static `ADVOCACY_RESOURCES` array and `showAdvocacy` state from ResourcesPage since they're replaced by this feature

