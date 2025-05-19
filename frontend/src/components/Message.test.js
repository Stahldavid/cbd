import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { Message } from './Message'; // Adjusted path
import { theme } from '../theme'; // Adjusted path

describe('Message Component', () => {
  const defaultProps = {
    text: 'Test message content',
    sender: 'user',
    timestamp: new Date(),
    type: 'text',
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
    expect(screen.getByText('Você')).toBeInTheDocument();
  });

  test('renders message text from AI', () => {
    renderWithMessage({ sender: 'ai', text: 'Hello from AI' });
    expect(screen.getByText('Hello from AI')).toBeInTheDocument();
    expect(screen.getByText('CuraAI')).toBeInTheDocument();
  });

  test('renders markdown content correctly', () => {
    const markdownText = 'This is **bold** and *italic*.';
    renderWithMessage({ text: markdownText });
    const boldElement = screen.getByText(
      (content, element) => element.tagName.toLowerCase() === 'strong' && content === 'bold'
    );
    const italicElement = screen.getByText(
      (content, element) => element.tagName.toLowerCase() === 'em' && content === 'italic'
    );
    expect(boldElement).toBeInTheDocument();
    expect(italicElement).toBeInTheDocument();
  });

  test('displays timestamp in HH:MM format', () => {
    const testDate = new Date(2023, 0, 1, 14, 35);
    renderWithMessage({ timestamp: testDate });
    const timeRegex = /\d{2}:\d{2}/;
    expect(screen.getByText(timeRegex)).toBeInTheDocument();
  });

  test('renders correctly for different message types (conceptual)', () => {
    const { rerender } = renderWithMessage({ type: 'info', text: 'Info message' });
    expect(screen.getByText('Info message')).toBeInTheDocument();

    rerender(
      <ThemeProvider theme={theme}>
        <Message {...defaultProps} type="error" text="Error message" />
      </ThemeProvider>
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
