# Testing Checklist

- Unit tests protect pure data transformation and small branching logic.
- Component tests protect rendering states, form validation, and event handling.
- Integration tests protect data flow across modules or routes.
- E2E tests protect critical browser flows and cross-page behavior.
- Regression tests should name the bug or user risk they prevent.
- Avoid tests that only assert implementation details while behavior can still break.
- Test names should explain the behavior or user risk, not only the function name.
- A recommended test is weak if it would still pass after the intended business behavior breaks.
