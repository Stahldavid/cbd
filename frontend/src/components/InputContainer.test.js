import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { InputContainer } from './InputContainer'; // Adjusted path
import { theme } from '../theme'; // Adjusted path

describe('InputContainer Component', () => {
  const mockOnChange = jest.fn();
  const mockOnSend = jest.fn();
  const mockOnKeyDown = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSend.mockClear();
    mockOnKeyDown.mockClear();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={theme}>
        <InputContainer
          value=""
          onChange={mockOnChange}
          onKeyDown={mockOnKeyDown}
          onSend={mockOnSend}
          disabled={false}
          {...props}
        />
      </ThemeProvider>
    );
  };

  test('renders textarea and send button', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/Digite sua pergunta.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar mensagem/i })).toBeInTheDocument();
  });

  test('calls onChange when typing in textarea', () => {
    renderComponent();
    const textarea = screen.getByPlaceholderText(/Digite sua pergunta.../i);
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  test('calls onSend when send button is clicked and input is not empty', () => {
    renderComponent({ value: 'Test message' });
    const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
    fireEvent.click(sendButton);
    expect(mockOnSend).toHaveBeenCalledTimes(1);
  });

  test('send button is disabled when input is empty or only whitespace', () => {
    const { rerender } = renderComponent({ value: '' });
    const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
    expect(sendButton).toBeDisabled();

    rerender(
      <ThemeProvider theme={theme}>
        <InputContainer
          value="   "
          onChange={mockOnChange}
          onKeyDown={mockOnKeyDown}
          onSend={mockOnSend}
          disabled={false}
        />
      </ThemeProvider>
    );
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when input has non-whitespace characters', () => {
    renderComponent({ value: 'Not empty' });
    const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
    expect(sendButton).toBeEnabled();
  });

  test('calls onKeyDown when a key is pressed in textarea', () => {
    renderComponent();
    const textarea = screen.getByPlaceholderText(/Digite sua pergunta.../i);
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    expect(mockOnKeyDown).toHaveBeenCalledTimes(1);
  });

  test('textarea auto-resizes (conceptual check, actual resize is visual)', () => {
    renderComponent();
    const textarea = screen.getByPlaceholderText(/Digite sua pergunta.../i);
    const initialHeight = textarea.style.height;
    fireEvent.input(textarea, { target: { value: 'Line 1\nLine 2\nLine 3' } });
    expect(textarea.style.height).not.toBe(initialHeight);
  });

  test('send button is disabled when disabled prop is true', () => {
    renderComponent({ value: 'Test message', disabled: true });
    const sendButton = screen.getByRole('button', { name: /Enviar mensagem/i });
    expect(sendButton).toBeDisabled();
  });
});
