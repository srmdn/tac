# TAC Agent Instructions

Work on TAC as a living technical reference for Agentic AI.

## Read First

- `README.md`
- `docs/about.md`
- `docs/index.md`
- `docs/stack/*.md`
- The relevant `docs/topics/*.md` files for the section you touch

## Rules

- Preserve the 4-layer structure
- Keep the tone technical, direct, and non-promotional
- Write for builders, not beginners needing a tutorial
- Keep prose tight and decision-first
- Treat pricing, context windows, provider features, and framework adoption as time-sensitive
- Verify time-sensitive claims against official sources before changing them
- Update or add `Production Reality` notes when a section can drift in real-world use
- Do not invent claims to make the project sound bigger

## Editing Guidance

- Prefer small, local edits over broad rewrites
- Keep headings and topic names aligned with the existing docs structure
- If a change affects structure, update the landing page and the relevant stack page together
- If a topic is out of date, mark it clearly as current as of a date or source it explicitly

## Repo Shape

- `docs/index.md` is the landing page
- `docs/stack/` holds the four stack layers
- `docs/topics/` holds the decision-focused deep dives
- `docs/public/` holds static assets

## Verification

- If you change docs content, build the site before finishing
- If a claim depends on current provider docs or pricing, check the source again before committing
