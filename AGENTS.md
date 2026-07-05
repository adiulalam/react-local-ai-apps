# React Local AI Apps Rule File

This file is used to define the rules for the react-local-ai-apps project. It is used by AI tools to understand the application and generate the necessary files for the application.

## Overview

This is a multi-app repository that contains all the necessary files for the react-local-ai-apps front-end applications. It is built using [Vite](https://vitejs.dev/) and React. The project structure contains the following:

- `src/apps`: Contains the different applications that make up the react-local-ai-apps suite. Each application is a self-contained unit with its own components and screens.
- `src/components`, `src/lib`, `src/hooks`: Contains shared components, utilities, and hooks that can be used across multiple applications.

## Design Patterns

Here are some of the design patterns that are used in the Orri application:

- Use of 2 space indentation on TS files
- Readability over conciseness
- Maintainability over performance
- Use of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages
- See `README.md` for more common commands to run the application

### Application and Library Specifics

- Use of [Prettier](https://prettier.io/) for code formatting
- Use of [ESLint](https://eslint.org/) for linting
- Use of [TypeScript](https://www.typescriptlang.org/) for type safety
- Use of [React](https://reactjs.org/) for building user interfaces
- Use of [ShadCN UI](https://ui.shadcn.com/) for UI components - Base UI
- Use of [Lucide Icons](https://lucide.dev/) for icons
- Use of [Date-fns](https://date-fns.org/) for date and time manipulation
- Use of [Lodash](https://lodash.com/) for utility functions
- Use of [Tailwind CSS](https://tailwindcss.com/) for styling
- Use of [Vite](https://vitejs.dev/) for building and serving the applications
- Use of [Vitest](https://vitest.dev/) for testing
- Use of [Playwright](https://playwright.dev/) for end-to-end testing
- Use of Github Actions for CI/CD

### Do's and Don'ts

#### Do:

- Avoid `any` types
- Use Lucide icons for all icons
- Use ShadCN UI components for all UI components
- Use Tailwind CSS for all styling
- Use Date-fns for all date and time manipulation
- Use Lodash or vanilla JS/TS for all utility functions
- Use `export const` for all exports in TypeScript files
- Use kebab-case for file names

#### Don't:

- Try to use `any` types
- Try to create too many nested divs
- Touch the ShadCN UI components folder on `components/UI`
