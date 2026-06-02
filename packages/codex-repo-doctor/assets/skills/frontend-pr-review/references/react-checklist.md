# React Checklist

- Components have one clear responsibility.
- Props are named by domain meaning, not implementation detail.
- Derived state is not duplicated in `useState`.
- `useEffect` is reserved for synchronization with external systems.
- Server data is not copied into local state without a reason.
- Context is not used for state that only a small subtree needs.
- Memoization has a measured or obvious reason.
- Form controls expose disabled, validation, and submit-pending states.
- Suspense, loading, empty, and error states match the user flow.
