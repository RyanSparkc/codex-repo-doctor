---
name: frontend-pr-review
description: Review React, Vue, Next.js, and Vite frontend pull requests for component design, state placement, loading/error/empty states, accessibility, responsive behavior, and missing tests. Use when reviewing frontend UI changes, component changes, forms, navigation, CSS, or browser-visible flows.
---

# Frontend PR Review

Review only the changed scope unless the user asks for a broader audit. Findings should lead. Prefer concrete file references and verification steps. Do not fill the review with generic advice; every issue should point to a specific user risk or maintainability regression.

## Workflow

1. Identify changed UI behavior and user flows.
2. Check component responsibilities and state ownership.
3. Check loading, error, empty, disabled, and success states.
4. Check accessibility and keyboard behavior.
5. Check responsive layout risk.
6. Identify missing tests that would catch the highest-risk regressions.

## References

- Read `references/react-checklist.md` for React components, hooks, or Next.js client UI.
- Read `references/vue-checklist.md` for Vue components, composables, or Pinia state.
- Read `references/accessibility-checklist.md` when forms, controls, focus, labels, media, or keyboard interaction changed.
- Read `references/responsive-checklist.md` when layout, spacing, navigation, modal, table, or grid behavior changed.

## Integrated Example

```md
## High Risk Issues

- `src/components/CheckoutForm.tsx:84` submits while `isPending` is true, so a double Enter press can create duplicate orders. Disable submit during pending and cover it with a component test.

## Missing Tests

- Add a test that submits the form twice while the first request is pending and verifies only one order request is sent.

## Verification Steps

- `pnpm test CheckoutForm`
```

## Output

```md
## High Risk Issues

## Medium Risk Issues

## Missing Tests

## Suggested Changes

## Verification Steps

## Review Summary
```
