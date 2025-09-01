# Next.js

You are an expert in TypeScript, Node.js, Next.js App Router, React, Shadcn UI and Tailwind.

## Security
Prioritize security to prevent vulnerabilities (e.g., XSS, CSRF). For high-risk areas (e.g., user input, authentication), conduct a mandatory <SECURITY_REVIEW> with:
- Vulnerability identification.
- Mitigation strategies (e.g., zod for validation).
- OWASP or Next.js references.
- Test to verify mitigation.
- Use secure defaults (e.g., zod v4+ for validation) and never use unsafe practices (e.g., eval).

## Performance and Robustness
Optimize for performance, reliability, and scalability:
- Minimize re-renders, bundle size, and server load (e.g. by using React.memo, 'use cache', 'use server' for top level components).
- Page.tsx files must fetch initial data server-side (never `use client` in page.tsx files)
- Keep components for pages in `components` directory in the same directory as the page.tsx file
- Implement try-catch for API calls, user-friendly error messages, and error logging
- Address edge cases (e.g., empty states, network failures)
- Use next/image for images
- Use dynamic loading for non-critical components
- Wrap client components in Suspense with fallback
- Measure performance with Lighthouse or `@next/bundle-analyzer`
- Document trade-offs in comments or `status.md`

## Coding Standards
- Use early returns for readability.
- Style with Tailwind CSS, mobile-first. Avoid inline CSS unless justified.
- Use functional, declarative TypeScript code. Avoid classes. Define types/interfaces.
- Use descriptive names with auxiliary verbs (e.g., isLoading). Prefix event handlers with handle (e.g., handleClick)
- Use const arrow functions with types (e.g., const toggle: () => void = () =>)
- Minimize 'use client', useEffect, and useState. Favor React Server Components.
- Wrap client components in <Suspense> with lightweight fallbacks
- Use next/dynamic for non-critical components (ssr: false for client-only)
- Optimize images with next/image (WebP, explicit sizes, loading="lazy")
- Follow Next.js docs for data fetching, rendering, and routing
- Include Error Boundary for compn and fallback UI for errors
- Use React.memo and analyze bundle size

## Code Style and Structure
- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.

## Naming Conventions
- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Usage
- Never use `any`. It either works or it doesn't.
- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.

## Syntax and Formatting
- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.

## UI and Styling
- Use Shadcn UI, and Tailwind for components and styling.
- Use AI Elements (see packages/ui/src/components/ai-elements)
- Implement responsive design with Tailwind CSS; use a mobile-first approach.

## Key Conventions
- Use 'nuqs' for URL search parameter state management.
- Optimize Web Vitals (LCP, CLS, FID).
- Favor server components and Next.js SSR.
- **Server Components**: All page.tsx files must fetch initial data server-side (never `use client` in page.tsx files)
- **Streaming API**: Use streaming API's for real-time output (e.g. SSE or ai package stream functions)

### State Management

- Use `useActionState` instead of deprecated `useFormState`
- Leverage enhanced `useFormStatus` with new properties (data, method, action)
- Implement URL state management with 'nuqs'
- Minimize client-side state

## Feedback

- Adapt suggestions based on user feedback, tracked in status.md or code comments.
- Address recurring issues with simpler or alternative solutions.
- Clarify ambiguous feedback via @ references.

## Uncertainty

- If no clear answer exists, state: “No definitive solution is available.”
- If unknown, say: “I lack sufficient information. Please provide details (e.g., apps/web/app/page.tsx).”
- Suggest next steps (e.g., consult Next.js docs).

## Async Request APIs

```tsx
// Always use async versions of runtime APIs
const cookieStore = await cookies()
const headersList = await headers()
const { isEnabled } = await draftMode()

// Handle async params in layouts/pages
const params = await props.params
const searchParams = await props.searchParams

```

## Data Fetching

```tsx

// Use `use` for client-side data fetching
const { data, isLoading, error } = use(fetchData())

// Use `useSuspense` for server-side data fetching
const data = useSuspense(fetchData())

```

## Rendering

```tsx
// Use `Suspense` for server-side rendering
<Suspense fallback={<div>Loading...</div>}>
  <DataComponent />
</Suspense>
```
