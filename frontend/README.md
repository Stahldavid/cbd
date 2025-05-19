# Frontend Documentation

## Overview

This directory contains the frontend application for `curaai-project`. It's a single-page application (SPA) built with **React** (using Create React App) that provides the user interface for interacting with the backend AI services. Key features include a chat interface, displaying Markdown content, and modals for prescriptions and settings.

## Tech Stack

*   **Framework/Library:** React (`^18.2.0`) with Create React App (`react-scripts: 5.0.1`)
*   **Language:** JavaScript (ES6+)
*   **Styling:** `styled-components` (`^6.1.1`), CSS (global styles in `index.css`, `App.css`, and component-specific styles).
*   **HTTP Client:** `axios` (`^1.6.2`) for making API requests to the backend.
*   **Markdown Rendering:** `react-markdown` (`^8.0.7`).
*   **Client-side PDF/Image:** `jspdf` (`^3.0.1`), `html2canvas` (`^1.4.1`) - suggesting capabilities for generating PDFs or capturing screen content.
*   **Linting:** ESLint (`^8.57.1`) with a flat configuration (`eslint.config.mjs`). Uses `@eslint/js`, `eslint-plugin-react`.
*   **Formatting:** Prettier (`^3.5.3`) with a configuration file (`.prettierrc.cjs`). Integrated with ESLint via `eslint-config-prettier`.
*   **State Management:** Primarily component state (`useState`, `useCallback`) and props. localStorage is used for session ID and doctor settings persistence.
*   **Testing:** Jest (via `react-scripts`) and React Testing Library (`@testing-library/react`). ESLint is configured for Jest globals.

## Setup Instructions

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    The frontend uses a proxy (defined in `frontend/package.json` as `"proxy": "http://localhost:3001"`) to send API requests to the backend during development. This means for most local development, a specific `.env` file in the `frontend/` directory might not be strictly necessary if your backend is running on `http://localhost:3001`.

    However, if you need to:
    *   Override the default API URL (e.g., if your backend is elsewhere).
    *   Add other client-side specific environment variables (e.g., for third-party service keys, feature flags).

    **Action Required (If Needed): Manually create a file named `.env` in this `frontend/` directory.**

    Then, copy the following example content (or relevant parts) into your newly created `frontend/.env` file. Remember, for Create React App, variables **must** be prefixed with `REACT_APP_`.

    **Example content for `frontend/.env`:**
    ```env
    # Frontend Environment Variables
    # Paste relevant parts into your manually created frontend/.env file if needed.

    # Example: Override API URL if not using the proxy or if backend is on a different host/port
    # REACT_APP_API_URL=http://localhost:3002/api

    # Example: A public API key for a third-party service used by the frontend
    # REACT_APP_CLIENT_SIDE_MAPS_KEY=YOUR_PUBLIC_MAPS_KEY_HERE

    # PUBLIC_URL=http://your-deployment-url.com
    ```

    *Important:*
    *   Only create `frontend/.env` if you need to customize these types of variables.
    *   The `.env` file (if created) should be listed in your root `.gitignore` file.

## Available Scripts

In the `frontend/package.json` file, you can find the following scripts:

*   **`npm start`**:
    *   Runs the app in development mode (`react-scripts start`).
    *   Open [http://localhost:3000](http://localhost:3000) (by default) to view it in the browser.
    *   The page will reload if you make edits.
*   **`npm test`**:
    *   Launches the test runner in interactive watch mode (`react-scripts test`).
*   **`npm run build`**:
    *   Builds the app for production to the `build/` folder (`react-scripts build`).
    *   It correctly bundles React in production mode and optimizes the build for performance.
*   **`npm run eject`**:
    *   Removes the single build dependency (Create React App) and copies all configuration files (webpack, Babel, ESLint, etc.) into your project. **This is a one-way operation.** Use with caution.
*   **`npm run lint`**:
    *   Lints all relevant files in the project using ESLint (`eslint .`).
    *   ESLint configuration is in `frontend/eslint.config.mjs`.
*   **`npm run lint:fix`**:
    *   Attempts to automatically fix linting issues found by ESLint (`eslint . --fix`).
*   **`npm run format`**:
    *   Formats code in `src/` directory (JS, JSX, JSON, CSS, MD files) using Prettier (`prettier --write "src/**/*.{js,jsx,json,css,md}"`).
    *   Prettier configuration is in `frontend/.prettierrc.cjs`.

## Project Structure

*   `public/`: Contains static assets like `index.html` (the main HTML page), favicons, and `manifest.json`.
*   `src/`:
    *   `index.js`: The JavaScript entry point for the application. Renders the root `App` component.
    *   `App.js`: The main application component, containing routing and overall layout. Manages significant parts of the UI logic and state.
    *   `index.css`, `App.css`: Global and App-level CSS stylesheets.
    *   `theme.js`: Theme configuration for `styled-components`.
    *   `ChatSection.js`, `PrescriptionModal.js`, `SettingsModal.js`, `functionComponents.js`: Core feature components.
    *   `components/`: Contains smaller, reusable UI components like:
        *   `ChatContainer.js`, `Header.js`, `Footer.js`, `InputContainer.js`, `Message.js`, `ThinkingIndicator.js`
    *   `reportWebVitals.js`: For measuring performance metrics.
    *   `setupTests.js`: Test setup file for Jest.
*   `eslint.config.mjs`: ESLint flat configuration file.
*   `.prettierrc.cjs`: Prettier configuration file.
*   `package.json`: Lists dependencies, scripts, and other project metadata.

## Linting and Formatting

*   **ESLint:** Configured via `frontend/eslint.config.mjs`. It uses the modern flat config format.
    *   Includes rules for JavaScript (`@eslint/js`), React (`eslint-plugin-react`), and disables rules that conflict with Prettier (`eslint-config-prettier`).
    *   Recognizes Jest globals for test files.
    *   Run `npm run lint` to check for issues.
    *   Run `npm run lint:fix` to attempt automatic fixes.
*   **Prettier:** Configured via `frontend/.prettierrc.cjs`.
    *   Run `npm run format` to format files in the `src/` directory.

It's highly recommended to integrate ESLint and Prettier with your IDE for real-time feedback and auto-formatting on save.

## Deployment

*   After running `npm run build`, the `build/` directory will contain the static assets for deployment to any static site hosting provider (e.g., Netlify, Vercel, GitHub Pages, or your own server).

## Further Development Notes

*   **Component Structure:** `App.js` is a large component. Consider refactoring it by breaking it down into smaller, more manageable components and custom hooks for better maintainability and testability.
*   **State Management:** While local state and context are sufficient for many cases, if global state complexity grows, evaluate if a more dedicated library (like Zustand or Redux Toolkit) might be beneficial.
*   **Testing:** While React Testing Library is set up, ensure comprehensive tests are written for components, user interactions, and critical application flows.
