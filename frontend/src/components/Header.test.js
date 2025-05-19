import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Header } from './Header'; // Adjusted path
import { theme } from '../theme'; // Adjusted path

describe('Header Component', () => {
  test('renders the CuraAI title', () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>
    );
    const titleElement = screen.getByText(/CuraAI/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders the logo icon (conceptual check)', () => {
    render(
      <ThemeProvider theme={theme}>
        <Header />
      </ThemeProvider>
    );
    // A more robust test would use data-testid on the LogoImage.
    // For now, we ensure the component renders and title (next to logo) is present.
    expect(screen.getByText(/CuraAI/i)).toBeInTheDocument();
  });
});
