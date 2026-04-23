# Product Ideas Backlog

## Action Cards (saved for later)

Status: backlog

Goal: make trends actionable (not just informational) with one-tap next steps under each story.

Core concept:
- Add a small "Action Cards" strip under trend cards.
- Show category-specific actions users can take immediately.
- Keep actions practical and local-first for Haiti + diaspora audiences.

Examples by category:
- Immigration: find legal aid, download checklist, locate document services.
- Disaster: shelter map, emergency contacts, report neighborhood status.
- Community: donate, volunteer, post local support updates.
- Jobs/Business: post opportunity, apply now, offer local service.

Why this is different:
- Turns passive feed consumption into real-world utility.
- Builds trust through helpful outcomes, not just engagement loops.

Monetization opportunities:
- Sponsored action slots ("Presented by ...").
- Lead fees per qualified click/form.
- Paid priority placement for verified organizations/businesses.
- Premium local directory subscriptions for service providers.

MVP sketch (later):
1. Define 3-5 action templates per trend category.
2. Add a lightweight `action_cards` data source (JSON or DB table).
3. Render 1-3 cards under each `TrendCard`.
4. Track click analytics per action card.
5. Add sponsored/partner labels and basic moderation rules.
