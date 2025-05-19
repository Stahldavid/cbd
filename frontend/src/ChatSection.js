// // ChatSection.js - Componente para a área de chat

// import React from 'react';
// import styled from 'styled-components';
// import { FunctionCallDisplay, FunctionResultDisplay } from './functionComponents';

// export const ChatWrapper = styled.div`
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   padding: 1rem 1.5rem;
//   max-width: 1200px;
//   margin: 0 auto;
//   width: 100%;
//   height: 100%;
// `;

// // Moded indicator component
// const ModeIndicator = styled.div`
//   display: inline-flex;
//   align-items: center;
//   padding: 0.3rem 0.8rem;
//   background-color: ${props => props.active ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.1)'};
//   color: ${props => props.active ? 'white' : props.theme.colors.lightText};
//   border-radius: 9999px;
//   font-size: 0.75rem;
//   font-weight: 500;

//   &:before {
//     content: "";
//     display: inline-block;
//     width: 8px;
//     height: 8px;
//     border-radius: 50%;
//     background-color: ${props => props.active ? '#00f2ac' : '#6b7280'};
//     margin-right: 6px;
//   }
// `;

// // Toolbar area below header
// export const Toolbar = styled.div`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 0.75rem 1rem;
//   border-bottom: 1px solid ${props => props.theme.colors.border};
//   background-color: ${props => props.theme.colors.background};
// `;

// export const ToolbarControls = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;
// `;

// export const ActionButton = styled.button`
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 0.4rem 0.8rem;
//   background-color: ${props => props.theme.colors.primary};
//   color: white;
//   border: none;
//   border-radius: 6px;
//   font-size: 0.875rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: all 0.2s ease;
//   white-space: nowrap;

//   &:hover {
//     background-color: #1d4ed8;
//   }

//   svg {
//     margin-right: 0.25rem;
//   }

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//   }

//   &.success {
//     background-color: ${props => props.theme.colors.success};

//     &:hover {
//       background-color: ${props => props.theme.colors.successHover};
//     }
//   }
// `;

// // Toggle switch for streaming/normal mode
// export const ToggleSwitch = styled.label`
//   position: relative;
//   display: inline-block;
//   width: 44px;
//   height: 22px;
//   margin: 0 0.5rem;

//   input {
//     opacity: 0;
//     width: 0;
//     height: 0;
//   }

//   span {
//     position: absolute;
//     cursor: pointer;
//     top: 0;
//     left: 0;
//     right: 0;
//     bottom: 0;
//     background-color: rgba(255, 255, 255, 0.2);
//     transition: .3s;
//     border-radius: 22px;

//     &:before {
//       position: absolute;
//       content: "";
//       height: 18px;
//       width: 18px;
//       left: 2px;
//       bottom: 2px;
//       background-color: white;
//       transition: .3s;
//       border-radius: 50%;
//       box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//     }
//   }

//   input:checked + span {
//     background-color: ${props => props.theme.colors.primary};
//   }

//   input:checked + span:before {
//     transform: translateX(22px);
//   }
// `;

// export const ToggleLabel = styled.span`
//   font-size: 0.875rem;
//   color: ${props => props.theme.colors.lightText};
//   opacity: 0.7;
//   font-weight: 500;
// `;

// // Chat toolbar with controls
// export function ChatToolbar({ isStreamingMode, toggleStreamingMode, openPrescriptionModal, openSettingsModal }) {
//   return (
//     <Toolbar>
//       <ToolbarControls>
//         <ActionButton onClick={openPrescriptionModal}>
//           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/>
//           </svg>
//           Abrir Receituário
//         </ActionButton>
//         <ActionButton onClick={openSettingsModal} style={{ backgroundColor: '#4b5563' }}>
//           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//             <circle cx="12" cy="12" r="3"></circle>
//             <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
//           </svg>
//           Configurações
//         </ActionButton>
//       </ToolbarControls>

//       <div style={{ display: 'flex', alignItems: 'center' }}>
//         <ModeIndicator active={!isStreamingMode}>Normal</ModeIndicator>
//         <ToggleSwitch>
//           <input type="checkbox" checked={isStreamingMode} onChange={toggleStreamingMode} />
//           <span />
//         </ToggleSwitch>
//         <ModeIndicator active={isStreamingMode}>Streaming</ModeIndicator>
//       </div>
//     </Toolbar>
//   );
// }

// // Chat content area
// export function ChatContent({ messages, isThinking, messagesEndRef, Message, ThinkingIndicator }) {
//   return (
//     <ChatWrapper>
//       {/* Render all messages based on type */}
//       {messages.map(message => {
//         if (message.type === 'functionCall') {
//           return <FunctionCallDisplay key={message.id} functionCallInfo={message.functionCallInfo} />;
//         } else if (message.type === 'functionResult') {
//           return <FunctionResultDisplay key={message.id} functionResultInfo={message.functionResultInfo} />;
//         } else if (message.type !== 'info') { // Don't render the welcome info message here again
//           return <Message key={message.id} {...message} isStreaming={message.type === 'ai_streaming'} />;
//         }
//         return null; // Hide 'info' type from chat log
//       })}

//       {/* Thinking indicator */}
//       {isThinking && <ThinkingIndicator />}

//       {/* Scroll anchor */}
//       <div ref={messagesEndRef} />
//     </ChatWrapper>
//   );
// }

// ChatSection.js - Componente para a área de chat

import React from 'react';
import styled from 'styled-components';
import { FunctionCallDisplay, FunctionResultDisplay } from './functionComponents'; //

export const ChatWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem; // This padding will be inside the max-width
  padding-bottom: 90px; // Added padding to prevent overlap with sticky InputContainer (adjust if needed)
  max-width: 860px; // Reduced for a more Claude-like centered feel
  margin: 0 auto; // Centers the block
  width: 100%; // Ensures it takes full width up to max-width
  // height: 100%; // Removed to allow natural height based on content and ensure page scrolls
`; //

// Moded indicator component
// *** ADICIONAR 'export' AQUI ou na lista no final ***
export const ModeIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.8rem;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.primary : 'rgba(255, 255, 255, 0.1)'}; // Changed to $active
  color: ${(props) =>
    props.$active ? 'white' : props.theme.colors.lightText}; // Changed to $active
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;

  &:before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${(props) => (props.$active ? '#00f2ac' : '#6b7280')}; // Changed to $active
    margin-right: 6px;
  }
`; //

// Toolbar area below header
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border}; // Original border for visual separation
  background-color: ${(props) => props.theme.colors.background}; // Ensure background is opaque
  position: sticky;
  top: 65px; // Assuming header height is approx 65px. Adjust if needed.
  z-index: 99; // Below header (z-index 100), but above other content
  // Add another border of the same color as the background to cover the 1px gap
  box-shadow: 0 1px 0 0 ${(props) => props.theme.colors.background}; // This acts like a 1px bottom-fill
`; //

export const ToolbarControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`; //

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1rem; // Updated padding
  background-color: ${(props) => props.theme.colors.primary}; //
  color: white;
  border: none;
  border-radius: 8px; // Updated border-radius
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    // Modificado para não aplicar hover quando desabilitado
    background-color: #1d4ed8; // Cor um pouco mais escura para hover
  }

  svg {
    margin-right: 0.25rem;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.success {
    background-color: ${(props) => props.theme.colors.success}; //

    &:hover:not(:disabled) {
      // Modificado para não aplicar hover quando desabilitado
      background-color: ${(props) => props.theme.colors.successHover}; //
    }
  }
`; //

// Toggle switch for streaming/normal mode
export const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
  margin: 0 0.5rem;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 22px;

    &:before {
      position: absolute;
      content: '';
      height: 18px;
      width: 18px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  input:checked + span {
    background-color: ${(props) => props.theme.colors.primary}; //
  }

  input:checked + span:before {
    transform: translateX(22px);
  }
`; //

export const ToggleLabel = styled.span`
  font-size: 0.875rem;
  color: ${(props) => props.theme.colors.lightText}; //
  opacity: 0.7;
  font-weight: 500;
`; //

// Chat toolbar component (renderiza os controles passados como children)
// Removido o conteúdo interno fixo, agora ele aceita 'children'
export function ChatToolbar({
  children,
  _isStreamingMode,
  _toggleStreamingMode,
  _openPrescriptionModal,
  _openSettingsModal,
}) {
  return (
    <Toolbar>
      {' '}
      {/* */}
      {/* Renderiza os 'children' passados (que incluirão ToolbarControls e o modo) */}
      {children}
    </Toolbar> //
  );
}

// Chat content area
export function ChatContent({ messages, isThinking, messagesEndRef, Message, ThinkingIndicator }) {
  //
  return (
    //
    <ChatWrapper>
      {' '}
      {/* */}
      {/* Render all messages based on type */}
      {messages.map((message) => {
        //
        if (message.type === 'functionCall') {
          //
          return (
            <FunctionCallDisplay key={message.id} functionCallInfo={message.functionCallInfo} />
          ); //
        } else if (message.type === 'functionResult') {
          //
          return (
            <FunctionResultDisplay
              key={message.id}
              functionResultInfo={message.functionResultInfo}
            />
          ); //
        } else if (message.type !== 'info') {
          // Don't render the welcome info message here again //
          return (
            <Message key={message.id} {...message} isStreaming={message.type === 'ai_streaming'} />
          ); //
        }
        return null; // Hide 'info' type from chat log //
      })}
      {/* Thinking indicator */}
      {isThinking && <ThinkingIndicator />} {/* */}
      {/* Scroll anchor */}
      <div ref={messagesEndRef} /> {/* */}
    </ChatWrapper> //
  );
}

// *** ASSEGURE QUE TODOS OS COMPONENTES NECESSÁRIOS ESTÃO EXPORTADOS ***
// (Não precisa mais listar explicitamente aqui se você usa 'export const' em cada um)
