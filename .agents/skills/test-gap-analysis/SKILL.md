---
name: test-gap-analysis
description: Identify behavior changed by a pull request and the missing unit, integration, or end-to-end tests needed to protect that behavior. Use when code changed but test coverage is uncertain, sparse, or absent.
---

# Test Gap Analysis

Focus on behavior that users, maintainers, or API consumers can observe. A useful test should fail when the business behavior breaks. Avoid tests that only prove an implementation detail was called.

## Workflow

1. List changed behavior.
2. Map existing tests to that behavior.
3. Find high-value missing test cases.
4. Recommend minimal test files and verification commands.

## References

- Read `references/testing-checklist.md` when choosing unit, integration, or e2e coverage.

## Integrated Example

```md
## Changed Behavior

- Checkout now applies a discount code before computing tax.

## Missing Test Cases

- Add an integration test that applies a valid discount code and verifies tax is computed from the discounted subtotal.
- Add a regression test for an invalid discount code so the total remains unchanged and the validation message stays visible.

## Minimal Test Plan

- `pnpm test checkout`
```

## Output

```md
## Changed Behavior

## Existing Test Coverage

## Missing Test Cases

## Suggested Test Files

## Minimal Test Plan
```
