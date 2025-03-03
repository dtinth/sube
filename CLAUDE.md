# Project Guidelines

## Commands

- `pnpm dev` - Start development server (port 12424)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking (via tsc --noEmit --project tsconfig.app.json)

## UI Frameworks & Libraries

- **UI Toolkit**: Radix UI Themes (`@radix-ui/themes`) for components
- **Icons**: Radix UI Icons (`@radix-ui/react-icons`) for iconography
- **Routing**: React Router DOM for navigation
- **Storage**: idb-keyval for IndexedDB operations with PROJECT_PREFIX
- **State Management**: nanostores (@nanostores/react) for global state
- **Styling**: Tailwind CSS for additional custom styling when needed
- **Data Validation**: zod for validating JSON and form inputs
- **Subtitle Parsing**: subtitle library for parsing SRT and VTT files
- **Polyfills**: vite-plugin-node-polyfills for browser compatibility with Node.js modules

## Code Style Guidelines

- **Imports**: Group imports by external libraries, then internal modules
- **Typing**: Use TypeScript interfaces (not types), strict mode enabled 
- **React Components**: Use functional components with explicit typing (React.FC<Props>)
- **Naming**: PascalCase for components/interfaces, camelCase for functions/variables
- **Error Handling**: Use try/catch with specific error messages in console.error()
- **Component Structure**: Props interface at top, followed by component definition
- **Component Design**: Follow composable patterns with small, focused components
- **State Management**: Use nanostores for global state, React state for local UI state
- **Data Flow**: Sort data by updatedAt timestamp in descending order

## UI Component Patterns

- **Modals**: Use Radix Dialog component via our Modal component
- **Buttons**: Use Radix Button component with appropriate variant/color
- **Cards**: Use Radix Card component for content containers
- **Layout**: Use Radix Container, Flex, and Grid for layout
- **Typography**: Use Radix Heading and Text components for typography
- **Menus**: Use Radix DropdownMenu component for dropdown menus
- **Project Components**: Build composable components that accept children or render props

## Project Structure

- **/src/components**: Reusable UI components
  - **/src/components/project**: Project-specific components
- **/src/pages**: Top-level page components
- **/src/stores**: Nanostores for global state management
- **/src/utils**: Utility functions and helpers
- **/src/types.ts**: Shared TypeScript interfaces
