import React from 'react';
import styled, { keyframes } from 'styled-components';
import ReactMarkdown from 'react-markdown';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const MessageContainer = styled.div`
  padding: 1rem;
  border-radius: 12px;
  max-width: 100%;
  word-break: break-word;
  position: relative;
  animation: ${fadeIn} 0.3s ease-out;
  margin: 0.5rem 0;

  ${(props) =>
    props.sender === 'user'
      ? `
    background-color: ${props.theme.colors.userMessageBg};
    color: ${props.theme.colors.text};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `
      : `
    background-color: transparent;
    color: ${props.theme.colors.text};
    padding-left: 0;
    padding-right: 0;
    border: none;
    box-shadow: none;
  `}

  @media (prefers-color-scheme: dark) {
    ${(props) =>
      props.sender === 'user'
        ? `
      background-color: ${props.theme.colors.userMessageBg};
      color: rgba(255, 255, 255, 0.95);
    `
        : `
      color: rgba(255, 255, 255, 0.95);
    `}
  }

  @media (max-width: ${(props) => props.theme.breakpoints.mobile}) {
  }
`;

const SenderIndicator = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.85;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: ${(props) => props.sender === 'user' ? 'inherit' : props.theme.colors.text};
`;

const Time = styled.div`
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 0.6rem;
  text-align: right;
  color: ${(props) => props.sender === 'user' ? 'inherit' : props.theme.colors.text};
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

  & ul,
  & ol {
    margin-left: 1.5rem;
    margin-bottom: 0.75rem;

    & li {
      margin-bottom: 0.25rem;
    }
  }

  & a {
    color: ${(props) => props.theme.colors.primary};
    text-decoration: none;
    border-bottom: 1px solid ${(props) => props.theme.colors.primary}40;
    transition: border-bottom-color 0.2s ease;

    &:hover {
      border-bottom-color: ${(props) => props.theme.colors.primary};
    }
  }

  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
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

export const Message = ({ text_content, sender, timestamp, type }) => {
  // Definir rótulo do remetente
  const senderLabel = sender === 'user' ? 'Você' : 'CuraAI';

  return (
    <MessageContainer sender={sender} type={type}>
      <SenderIndicator sender={sender}>{senderLabel}</SenderIndicator>
      <MarkdownContent>
        <ReactMarkdown>{text_content}</ReactMarkdown>
      </MarkdownContent>
      <Time sender={sender}>{timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Time>
    </MessageContainer>
  );
};
