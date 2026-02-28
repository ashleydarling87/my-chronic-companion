

## AI-Powered Articles via Perplexity Search

### Overview
When users tap "Articles" on the Resources page, they'll see a dedicated articles page with AI-sourced content from reputable health and wellness domains. Articles are personalized based on the user's condition, symptoms, and recent log entries.

### Architecture

```text
User taps "Articles"
       |
       v
ArticlesPage.tsx  -->  Edge Function (search-articles)
                              |
                              v
                       Perplexity API
                       (domain-filtered to trusted sources)
                              |
                              v
                       Returns articles with citations
```

### Step 1: Connect Perplexity Connector
- Use the Perplexity connector (available in Lovable) to provide the API key automatically to edge functions.

### Step 2: Create `search-articles` Edge Function
- Accepts the user's condition, tracked symptoms, and an optional search category
- Builds a targeted search query (e.g., "chronic pain sleep management for fibromyalgia")
- Calls Perplexity's chat completions API with `sonar` model
- **Domain filtering**: Restricts results to a curated allowlist of reputable sources:
  - Medical: mayoclinic.org, clevelandclinic.org, nih.gov, healthline.com, webmd.com
  - Mental Health: nami.org, psychologytoday.com, mhanational.org
  - Chronic Pain: theacpa.org, painscience.com
  - Wellness: headspace.com, calm.com
- Returns structured results with title, summary, source URL, and domain name
- Includes citations from Perplexity's response for transparency

### Step 3: Create ArticlesPage Component
- New page at `/resources/articles`
- On load, fetches personalized articles based on user preferences (condition, symptoms)
- Displays article cards with:
  - Title and brief summary
  - Source domain badge (e.g., "Mayo Clinic", "NIH")
  - External link to the full article
- Loading skeleton while fetching
- Category tabs or topic chips (e.g., "Pain Management", "Sleep", "Mental Health", "Nutrition") to refine searches
- Results are cached briefly so re-visiting doesn't re-fetch immediately

### Step 4: Add Route and Navigation
- Add `/resources/articles` route to App.tsx as a protected route
- The existing "Articles" category button on ResourcesPage already navigates to `/resources/articles`

### Technical Details

**Edge Function** (`supabase/functions/search-articles/index.ts`):
- Uses `PERPLEXITY_API_KEY` from the connector
- Builds a system prompt that instructs Perplexity to return structured JSON with article recommendations
- Uses `search_domain_filter` to restrict to trusted domains
- Returns an array of `{ title, summary, url, source }` objects

**ArticlesPage** (`src/pages/ArticlesPage.tsx`):
- Uses user preferences (condition, symptoms) to build the initial query
- Topic chips for filtering: "All", "Pain Management", "Sleep", "Mental Health", "Mindfulness", "Nutrition"
- Each article card links externally to the source
- Shows source attribution prominently for trust
- Back button to return to Resources grid

**Caching Strategy**:
- Use React Query with a 10-minute stale time so repeated visits don't spam the API
- Cache key includes the selected topic so different topics get their own cache

