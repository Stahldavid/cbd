import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Message } from '../../src/components/Message'; // Adjusted path
import { theme } from '../../src/theme'; // Adjusted path

describe('Message Component', () => {
  const defaultProps = {
    text: 'Test message content',
    sender: 'user',
    timestamp: new Date(),
    type: 'text', // 'text', 'ai', 'user', 'error', 'info', 'functionCall', 'functionResult'
  };

  const renderWithMessage = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <Message {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  test('renders message text from user', () => {
    renderWithMessage({ sender: 'user', text: 'Hello from user' });
    expect(screen.getByText('Hello from user')).toBeInTheDocument();
    expect(screen.getByText('Você')).toBeInTheDocument(); // Sender label
  });

  test('renders message text from AI', () => {
    renderWithMessage({ sender: 'ai', text: 'Hello from AI' });
    expect(screen.getByText('Hello from AI')).toBeInTheDocument();
    expect(screen.getByText('CuraAI')).toBeInTheDocument(); // Sender label
  });

  test('renders markdown content correctly', () => {
    const markdownText = 'This is **bold** and *italic*.';
    renderWithMessage({ text: markdownText });
    // ReactMarkdown will render <strong> and <em> tags
    const boldElement = screen.getByText((content, element) => element.tagName.toLowerCase() === 'strong' && content === 'bold');
    const italicElement = screen.getByText((content, element) => element.tagName.toLowerCase() === 'em' && content === 'italic');
    expect(boldElement).toBeInTheDocument();
    expect(italicElement).toBeInTheDocument();
  });

  test('displays timestamp in HH:MM format', () => {
    const testDate = new Date(2023, 0, 1, 14, 35); // 1st Jan 2023, 2:35 PM
    renderWithMessage({ timestamp: testDate });
    // Check for a string that matches HH:MM format, e.g., '14:35' or '02:35 PM' (depending on toLocaleTimeString)
    // For simplicity, we just check if part of it is there or use a regex.
    // toLocaleTimeString output can vary by environment/locale.
    // A more robust way could be to mock Date or toLocaleTimeString if exact format is critical.
    const timeRegex = /\d{2}:\d{2}/; // Matches HH:MM
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  // Based on the Message component code, 'type' prop doesn't seem to alter rendering significantly by itself,
  // but it's passed to MessageContainer. This could be tested via snapshot or by checking styled-component classes if specific styles depend on it.
  test('renders correctly for different message types (conceptual)', () => {
    const { rerender } = renderWithMessage({ type: 'info', text: 'Info message' });
    expect(screen.getByText('Info message')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <Message {...defaultProps} type="error" text="Error message" />
      </ThemeProvider>
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
    // Further tests could check for style differences if the `type` prop on MessageContainer results in different styles.
  });
}); 