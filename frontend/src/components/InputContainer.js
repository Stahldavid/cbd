import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  gap: 0.75rem;
  background-color: ${props => props.theme.colors.background};
  padding: 1rem 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    flex-direction: column;
  }
  
  @media (prefers-color-scheme: dark) {
    background-color: #222529;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  background-color: ${props => props.theme.colors.background};
  resize: none;
  font-size: 0.95rem;
  line-height: 1.5;
  outline: none;
  transition: all 0.2s ease;
  min-height: 20px;
  max-height: 150px;
  font-family: inherit;
  
  &:focus {
    background-color: rgba(0, 0, 0, 0.03);
  }
  
  @media (prefers-color-scheme: dark) {
    background-color: #222529;
    color: rgba(255, 255, 255, 0.9);
    
    &:focus {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
    
    @media (prefers-color-scheme: dark) {
      color: rgba(255, 255, 255, 0.3);
    }
  }
`;

const SendButton = styled.button`
  padding: 0.75rem 1.25rem;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    background-color: rgba(0, 0, 0, 0.1);
    cursor: not-allowed;
    
    @media (prefers-color-scheme: dark) {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.4);
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 100%;
  }
`;

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const InputContainer = React.forwardRef(({ value, onChange, onKeyDown, onSend, disabled }, ref) => {
  const textAreaRef = useRef(null);
  
  // Forward the ref
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textAreaRef.current);
      } else {
        ref.current = textAreaRef.current;
      }
    }
  }, [ref]);
  
  // Auto resize textarea height
  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = (target.scrollHeight) + 'px';
  };
  
  return (
    <Container>
      <TextArea
        ref={textAreaRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onInput={handleInput}
        placeholder="Digite sua pergunta..."
        rows="1"
        aria-label="Mensagem"
        disabled={disabled}
      />
      <SendButton 
        onClick={onSend} 
        aria-label="Enviar mensagem" 
        disabled={disabled || !value.trim()}
      >
        Enviar
        <SendIcon />
      </SendButton>
    </Container>
  );
});