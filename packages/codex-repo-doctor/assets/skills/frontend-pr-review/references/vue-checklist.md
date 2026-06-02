# Vue Checklist

- `computed` is preferred over `watch` for derived values.
- `watch` is used only for side effects or external synchronization.
- Pinia stores hold shared domain state, not incidental component UI state.
- Composables expose clear inputs and outputs.
- `ref` and `reactive` usage is consistent and easy to reason about.
- Template branches cover loading, error, empty, and success states.
- Events are named by user intent.
- Form validation remains visible and keyboard accessible.
