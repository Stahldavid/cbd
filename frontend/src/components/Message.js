import React from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MessageContainer = styled.div`
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  max-width: 85%;
  word-break: break-word;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
  align-self: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin: 0.25rem 0;
  
  ${props => props.sender === 'user' ? `
    background-color: ${props.theme.colors.primary}20;
    color: ${props.theme.colors.text};
  ` : `
    background-color: ${props.theme.colors.background}; 
    color: ${props.theme.colors.text};
    border: 1px solid rgba(0, 0, 0, 0.1);
  `}
  
  @media (prefers-color-scheme: dark) {
    ${props => props.sender === 'user' ? `
      background-color: ${props.theme.colors.primary}40;
      color: rgba(255, 255, 255, 0.9);
    ` : `
      background-color: #222529;
      color: rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `}
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    max-width: 95%;
  }
`;

const SenderIndicator = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  opacity: 0.7;
  letter-spacing: 0.02em;
  text-transform: uppercase;
`;

const Time = styled.div`
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 0.5rem;
  text-align: right;
`;

// Custom styles for markdown content
const MarkdownContent = styled.div`
  font-size: 0.95rem;
  line-height: 1.5;
  
  & p {
    margin-bottom: 0.75rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  & code {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.85em;
    
    @media (prefers-color-scheme: dark) {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
  
  & pre {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.75rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.75rem 0;
    
    @media (prefers-color-scheme: dark) {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    & code {
      background-color: transparent;
      padding: 0;
    }
  }
  
  & ul, & ol {
    margin-left: 1.5rem;
    margin-bottom: 0.75rem;
    
    & li {
      margin-bottom: 0.25rem;
    }
  }
  
  & a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    border-bottom: 1px solid ${props => props.theme.colors.primary}40;
    transition: border-bottom-color 0.2s ease;
    
    &:hover {
      border-bottom-color: ${props => props.theme.colors.primary};
    }
  }
  
  & h1, & h2, & h3, & h4, & h5, & h6 {
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  
  & h1 {
    font-size: 1.5rem;
  }
  
  & h2 {
    font-size: 1.3rem;
  }
  
  & h3 {
    font-size: 1.1rem;
  }
`;

export const Message = ({ text, sender, timestamp, type }) => {
  // Definir rótulo do remetente
  const senderLabel = sender === 'user' ? 'Você' : 'CuraAI';
  
  return (
    <MessageContainer sender={sender} type={type}>
      <SenderIndicator>{senderLabel}</SenderIndicator>
      <MarkdownContent sender={sender}>
        <ReactMarkdown>{text}</ReactMarkdown>
      </MarkdownContent>
      <Time>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Time>
    </MessageContainer>
  );
};