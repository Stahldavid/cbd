import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto; /* Alterado para auto para permitir rolagem */
  margin-bottom: 1rem;
  background-color: transparent;
  height: 100%;
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem; /* Aumentado de 1.5rem para 2.5rem para mais espaço entre mensagens */
  
  /* Scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
  
  &::-webkit-scrollbar {
    width: 8px; /* Aumentado de 6px para 8px para facilitar o uso */
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  @media (prefers-color-scheme: dark) {
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
`;

export const ChatContainer = ({ children }) => {
  return (
    <Container className="chat-container">
      <MessagesArea>
        {children}
      </MessagesArea>
    </Container>
  );
};