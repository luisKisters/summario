# Copilot Instructions

## UI/Component Guidelines

- Use shadcn-ui@latest instead of creating custom components, if there is a component available in shadcn-ui that fits the use case
- Always maintain consistent padding and spacing across components
- Use responsive design patterns (sm:, md:, lg: breakpoints)
- Prefer composition over inheritance for component design

## Database & API Guidelines

- Always for every use of Supabase use the appropriate types defined in /types/database.types.ts. ALWAYS. If there is something with Supabase, use the types from the mentioned file.
- Use proper error handling for all API routes and database operations
- Implement proper validation for all API endpoints
- Use TypeScript interfaces for API request/response types

## Package Management

- Always use pnpm, only use npm if pnpm is not working for some reason
- Use pnpm dlx for one-time package execution
- Keep dependencies updated and remove unused packages

## Code Quality

- Write self-documenting code with clear variable and function names
- Add JSDoc comments for complex functions and API endpoints
- Use proper TypeScript types, avoid 'any' unless absolutely necessary
- Implement proper loading states and error boundaries
- Follow React best practices (proper hook usage, avoid side effects in render)

## Testing Guidelines

- Update the To-Test-List in TODO.md when implementing new features
- Test both happy path and error scenarios
- Verify responsive design across different screen sizes
- Test with different user permissions and authentication states

## Performance Guidelines

- Minimize bundle size by using dynamic imports where appropriate
- Optimize images and static assets
- Use React.memo() for expensive components
- Implement proper caching strategies for API calls

## Accessibility Guidelines

- Ensure proper ARIA labels and semantic HTML
- Maintain good color contrast ratios
- Support keyboard navigation
- Provide meaningful alt texts for images
