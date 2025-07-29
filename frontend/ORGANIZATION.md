# Frontend Organization

This document outlines the organization structure for the Gitty frontend codebase.

## Directory Structure

### Components (`/components`)

- **`/ui`** - Reusable UI components (buttons, inputs, etc.)
- **`/features`** - Feature-specific components
  - **`/auth`** - Authentication-related components (LoginButton, etc.)
- **`/forms`** - Form components (to be added)
- **`/layout`** - Layout components (to be added)

### Hooks (`/lib/hooks`)

- **`/api`** - API-related hooks for data fetching
  - `useTasks` - Task management
  - `useUserProfile` - User profile data
  - `useUserEnterprises` - Enterprise management
  - `useUserRepos` - Repository data
  - `useUserOrgs` - Organization data
  - `useStats` - Statistics data
  - And more...
- **`/business`** - Business logic hooks
  - `useAuth` - Authentication logic
  - `useAnalyze` - Code analysis
  - `useDiagram` - Diagram generation
  - `useWaitlist` - Waitlist management
- **`/ui`** - UI-related hooks
  - `useIsMobile` - Mobile detection

### Types (`/lib/types`)

- **`/business`** - Business domain types
  - `User` - User entity type
  - `Enterprise` - Enterprise entity type
- **`/api`** - API-related types (to be added)
- **`/ui`** - UI component types (to be added)

### Utils (`/lib/utils`)

- **`/api`** - API utilities
  - `fetchBackend` - Backend API calls
  - `fetchFile` - File fetching utilities
  - `fetchRepos` - Repository data utilities
- **`/formatting`** - Data formatting utilities (to be added)
- **`/validation`** - Validation utilities (to be added)

## Import Conventions

### Using Index Files

For cleaner imports, use the index files:

```typescript
// Instead of individual imports
import { useAuth } from "@/lib/hooks/business/useAuth";
import { useTasks } from "@/lib/hooks/api/useTasks";

// Use index imports
import { useAuth } from "@/lib/hooks/business";
import { useTasks } from "@/lib/hooks/api";
```

### Import Order

1. React and Next.js imports
2. Third-party libraries
3. Internal components
4. Internal utilities/hooks
5. Types
6. Relative imports

## Best Practices

1. **Component Organization**: Group related components in feature directories
2. **Hook Categorization**: Separate API, business logic, and UI hooks
3. **Type Safety**: Use proper TypeScript types for all entities
4. **Clean Imports**: Use index files for cleaner import statements
5. **Consistent Naming**: Use kebab-case for directories, PascalCase for components

## Migration Notes

- All AI-generated comments have been removed for cleaner code
- Files have been reorganized according to their purpose
- Import paths have been updated throughout the codebase
- Index files have been created for easier imports
