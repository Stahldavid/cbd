import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
`;

const Indicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.colors.aiMessageBg};
  border-radius: 10px;
  max-width: 100px;
  align-self: flex-start;
  margin-bottom: 0.5rem;

  @media (prefers-color-scheme: dark) {
    background-color: #273c75;
  }
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  background-color: ${(props) => props.theme.colors.primary};
  border-radius: 50%;
  animation: ${bounce} 1.5s infinite ease-in-out;
  animation-delay: ${(props) => props.delay || '0s'};
`;

export const ThinkingIndicator = () => {
  return (
    <Indicator>
      <Dot />
      <Dot delay="0.2s" />
      <Dot delay="0.4s" />
    </Indicator>
  );
};
