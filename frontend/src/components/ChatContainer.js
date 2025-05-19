import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  flex: 1; /* Let this container grow and shrink */
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem; /* Or handle spacing via InputContainer */
  background-color: transparent;
  /* height: 100%; // Removed, flex:1 should work with parent height management */
  min-height: 0; /* Important for flex children that need to scroll */
`;

const MessagesArea = styled.div`
  flex: 1; /* This allows the area to grow and fill available space */
  /* or use flex-grow: 1; flex-shrink: 1; flex-basis: 0; */
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem; 
  overflow-y: auto; /* <<< CRITICAL FIX: Enable vertical scrolling */
  min-height: 0; /* Added to ensure it can shrink if needed, helps with flex scrolling */

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
      <MessagesArea>{children}</MessagesArea>
    </Container>
  );
};
