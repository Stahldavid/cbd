# CuraAI Automated Tests

This directory contains end-to-end tests for the CuraAI application using Playwright.

## Overview

The tests focus on the core functionality of the CuraAI application:
- Interacting with the AI assistant about CBD benefits and dosage recommendations
- Creating and downloading prescriptions for patients
- Verifying the accuracy of AI responses and prescription content

## Test Files

- `curaai-prescription-test.spec.js` - Tests the complete workflow of asking about CBD and generating a prescription

## Running the Tests

Before running tests, make sure both backend and frontend are running:

1. Start the backend server in one terminal:
   ```
   cd ../backend
   npm start
   ```

2. Start the frontend in another terminal:
   ```
   cd ../frontend
   npm start
   ```

3. Install Playwright and its dependencies if you haven't already:
   ```
   npm install
   npx playwright install
   ```

4. Run the Playwright E2E tests:
   ```
   npm run test:e2e
   ```

For a visual report of test results:
```
npx playwright show-report
```

## Important Note on Test Types

This project has two different types of tests:

1. **Component Tests** - Located in `src/components/*.test.js`
   - These use Jest and React Testing Library
   - Run with `npm test`
   - Test individual React components in isolation

2. **End-to-End Tests** - Located in `tests/*.spec.js`
   - These use Playwright
   - Run with `npm run test:e2e` 
   - Test the full application with real browser interactions

Make sure you're using the correct command for the type of test you want to run.

## Test Configuration

The Playwright configuration is in `../playwright.config.js`. Key settings include:
- Only `.spec.js` files are run by Playwright
- 60-second timeout for API responses
- Screenshot on test failure
- HTML test reports
- Video recording on test retry

## Notes for Test Maintenance

- The tests rely on specific text content in the UI, so if the application text changes significantly, the tests may need updating.
- The test assumes the AI model will respond with certain information about CBD for pain management. If the model's knowledge is updated, test assertions may need revision.
- Response times may vary based on the backend performance, so timeouts may need adjustment. 