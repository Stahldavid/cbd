# Backend Documentation

## Overview

This directory contains the Node.js backend application for `curaai-project`. It is built with Express.js and serves as an API for the frontend. The backend's core functionality revolves around interacting with Google's Gemini AI, including managing conversation history, processing user queries with potential function calling capabilities, and fetching/processing external web content or medical information (e.g., via PubMed search tools).

## Tech Stack

- **Framework:** Node.js, Express.js (`^5.1.0` - Note: This is a pre-release version of Express 5. The current stable is 4.x)
- **AI Integration:** `@google/genai` for interacting with Google's Gemini AI.
- **Web Content Processing:** `@mozilla/readability`, `jsdom`, `node-fetch`, `robots-parser`, `turndown`.
- **Data Handling:** `xml2js`.
- **Utilities:** `cors` (for Cross-Origin Resource Sharing), `dotenv` (for environment variable management).
- **Asynchronous Operations:** Leverages ES Modules (`"type": "module"` in `package.json`) and modern JavaScript async/await patterns.
- **Linting & Formatting:** ESLint, Prettier, `eslint-plugin-jest`, `eslint-config-prettier`.
- **Testing:** Jest, Supertest.

## Setup Instructions

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Variables:**
    This backend requires certain environment variables to be set for it to function correctly, primarily for the Gemini API key and server configuration.

    **Action Required: Manually create a file named `.env` in this `backend/` directory.**

    Then, copy the following content into your newly created `backend/.env` file and replace placeholder values (like `YOUR_GEMINI_API_KEY_HERE`) with your actual credentials and desired settings.

    ```env
    # Backend Environment Variables
    # Paste this content into your manually created backend/.env file.

    # Server Configuration
    PORT=3001 # Default port the backend server will run on

    # Gemini API Configuration
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY # Replace with your actual Gemini API Key

    # Optional: Define model name if different from default in geminiService.js
    # GEMINI_MODEL_NAME=gemini-1.5-flash-latest

    # Other configurations (uncomment and adjust as needed)
    # NODE_ENV=development # Set to 'development' for debug routes, 'production' otherwise

    # Database Configuration (Example for PostgreSQL - uncomment and adjust if you add a database)
    # DB_HOST=localhost
    # DB_PORT=5432
    # DB_USER=your_db_user
    # DB_PASSWORD=your_db_password
    # DB_NAME=your_db_name

    # API Keys for Tools (if any - uncomment and adjust as needed by specific tools)
    # TAVILY_API_KEY=YOUR_TAVILY_API_KEY
    # NCBI_API_KEY=YOUR_NCBI_API_KEY
    ```

    _Important:_

    - Ensure you have a `backend/.env` file.
    - Ensure `GEMINI_API_KEY` is correctly set within your `backend/.env` file.
    - The `.env` file should be listed in your root `.gitignore` file to prevent committing secrets.

## Available Scripts

In the `backend/package.json` file, you can find the following scripts:

- **`npm start`**:
  - Runs the application using `node server.js`.
  - This is the primary script to start the server.
- **`npm run dev`**:
  - Runs the application using `nodemon server.js` for development.
  - Nodemon will automatically restart the server when file changes are detected.
- **`npm run lint`**:
  - Lints the codebase using `eslint .`.
  - Checks for JavaScript errors and adherence to configured ESLint rules.
- **`npm run format`**:
  - Formats the codebase using `prettier --write . --ignore-path .gitignore`.
  - Ensures consistent code style across the project.
- **`npm test`**:
  - Runs the test suite using `jest`.
  - Executes all `*.test.js` files, primarily located in the `backend/tests/` directory.

## API Endpoints

The API is prefixed with `/api`.

- `GET /api/test`: A test endpoint.
- `POST /api/chat`: Main endpoint for chat interactions with function calling capabilities.
- `POST /api/stream`: Chat interactions with streaming responses and function calling.
- `POST /api/clear-session`: Clears the conversation history for a specified or default session.
- `GET /api/session-history/:sessionId?`: Retrieves the conversation history for a specified or default session.

## Project Structure

- `server.js`: Main entry point for the server. Initializes services, AI client, Express app, and routes.
- `config/`:
  - `express.js`: Sets up the Express application (middleware like CORS, JSON parsing).
  - `systemInstructions.js`: Builds the system instructions provided to the Gemini model.
- `controllers/`:
  - `chatController.js`: Handles the logic for chat requests, interacts with `geminiService` and `memoryService`.
- `routes/`:
  - `apiRoutes.js`: Defines all API routes and maps them to controller functions.
- `services/`:
  - `geminiService.js`: Manages interactions with the Google Gemini API (initialization, sending requests).
  - `memoryService.js`: Manages conversation history/memory for user sessions, including periodic cleanup.
- `tests/`: Contains all backend tests.
  - `controllers/`: Unit tests for controllers.
  - `routes/`: Integration tests for API routes.
  - `services/`: Unit tests for services.
  - `tools/`: Unit tests for individual tools.
- `tools/`:
  - `index.js`: Exports available functions/tools for the Gemini model.
  - Contains various modules defining specific tools (e.g., `searchPubmed.js`, `fetchAndProcessUrl.js`, `fillPrescription.js`, `tavilySearch.js`).
- `utils/`: Currently empty. Intended for helper functions used across the backend.
- `.env`: Stores environment variables (e.g., API keys, port). **Must be created by copying content similar to the example provided in 'Environment Variables' section.**
- `eslint.config.js`: ESLint configuration file (Flat Config format).
- `.prettierrc.cjs`: Prettier configuration file (CommonJS format).
- `jest.config.js`: Jest test runner configuration.
- `package.json`: Lists dependencies and scripts.

## Code Style and Linting

This project uses ESLint for linting and Prettier for code formatting to maintain a consistent codebase.

-   **ESLint**:
    -   Configuration is in `eslint.config.js` (ESLint Flat Config).
    -   It uses `js.configs.recommended` as a base.
    -   Integrates with `eslint-config-prettier` to disable ESLint rules that would conflict with Prettier.
    -   Uses `eslint-plugin-jest` for Jest-specific linting rules in test files.
    -   Custom rule: `no-unused-vars` is configured to allow unused arguments prefixed with an underscore (e.g., `_unusedParam`).
    -   Run `npm run lint` to check for linting issues.

-   **Prettier**:
    -   Configuration is in `.prettierrc.cjs`.
    -   Settings include `semi: true`, `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 100`, `tabWidth: 2`.
    -   Run `npm run format` to automatically format all JavaScript files in the project (respecting `.gitignore`).

It's highly recommended to integrate ESLint and Prettier with your IDE for real-time feedback and auto-formatting on save.

## Testing

-   **Framework**: Jest is used as the testing framework, along with Supertest for API endpoint testing.
-   **Configuration**: Jest is configured in `jest.config.js` to use the `node` test environment.
-   **Location**: Tests are located in the `backend/tests/` directory, with subdirectories for `controllers`, `routes`, `services`, and `tools`.
-   **Execution**: Run tests using `npm test`.

## Further Development Notes

- **Express 5:** The project uses Express `^5.1.0`, which is a beta version. Be mindful of potential changes before its final release. Official Express 5 documentation should be consulted for any issues.
- **Error Handling:** Review and enhance error handling throughout the application for robustness.
- **Security:** Ensure security best practices are followed, especially concerning API key management and input validation if the application handles sensitive data or is exposed to the public.
- The `utils/` directory is available for any common utility functions that might be needed.
 