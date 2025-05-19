import { render, screen } from '@testing-library/react';
import App from './App';

// Automatically uses the mock from __mocks__/jspdf.js

test('renders CuraAI title in the header', () => {
  render(<App />);
  // Check for the H1 a specific title to avoid conflicts with other occurrences
  const titleElement = screen.getByRole('heading', { name: /CuraAI/i, level: 1 });
  expect(titleElement).toBeInTheDocument();
});
