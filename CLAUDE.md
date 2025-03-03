# Project Guidelines

## Commands

- `pnpm dev` - Start development server (port 12424)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking (via tsc --noEmit)

## Code Style Guidelines

- **Imports**: Group imports by external libraries, then internal modules
- **Typing**: Use TypeScript interfaces (not types), strict mode enabled
- **React Components**: Use functional components with explicit typing (React.FC<Props>)
- **Naming**: PascalCase for components/interfaces, camelCase for functions/variables
- **Error Handling**: Use try/catch with specific error messages in console.error()
- **Storage**: Use idb-keyval for IndexedDB operations with PROJECT_PREFIX
- **Styling**: Use Tailwind CSS utility classes in className props
- **Component Structure**: Props interface at top, followed by component definition
- **Data Flow**: Sort data by updatedAt timestamp in descending order
