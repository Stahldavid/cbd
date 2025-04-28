
// // // App.js - Arquivo principal com integração ao sistema de memória do backend

// // import React, { useState, useRef, useCallback, useEffect } from 'react';
// // import { flushSync } from 'react-dom';
// // import { ThemeProvider } from 'styled-components';
// // import styled from 'styled-components';
// // import { theme, GlobalStyle } from './theme';
// // import { Header } from './components/Header';
// // import { ChatContainer } from './components/ChatContainer';
// // import { InputContainer } from './components/InputContainer';
// // import { Footer } from './components/Footer';
// // import { ThinkingIndicator } from './components/ThinkingIndicator';
// // import { Message } from './components/Message';
// // import { ChatToolbar, ChatContent } from './ChatSection';
// // import { PrescriptionModal } from './PrescriptionModal';
// // import { SettingsModal } from './SettingsModal';
// // import { v4 as uuidv4 } from 'uuid'; // Adicione esta dependência para gerar IDs de sessão

// // // --- Styled Components ---
// // const MainContainer = styled.main`
// //   display: flex;
// //   flex-direction: column;
// //   height: 100vh;
// //   width: 100%;
// //   position: relative;
// // `;

// // const ClearButton = styled.button`
// //   background-color: ${props => props.theme.colors.secondary};
// //   color: white;
// //   border: none;
// //   border-radius: 4px;
// //   padding: 8px 16px;
// //   margin-left: 10px;
// //   cursor: pointer;
// //   font-size: 14px;
  
// //   &:hover {
// //     background-color: ${props => props.theme.colors.secondaryDark};
// //   }
  
// //   &:disabled {
// //     opacity: 0.6;
// //     cursor: not-allowed;
// //   }
// // `;

// // // --- App Component ---
// // function App() {
// //   // --- State ---
// //   const [messages, setMessages] = useState([
// //     { id: 'welcome', text: 'Olá! Eu sou o CuraAI, seu assistente de saúde. Como posso ajudar você hoje?', sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true }
// //   ]);
// //   const [inputValue, setInputValue] = useState('');
// //   const [isThinking, setIsThinking] = useState(false);
// //   const [isStreamingMode, setIsStreamingMode] = useState(true);
// //   const [sessionId, setSessionId] = useState(() => {
// //     // Recupera sessionId do localStorage ou cria um novo
// //     const savedSessionId = localStorage.getItem('curaAISessionId');
// //     if (savedSessionId) return savedSessionId;
    
// //     const newSessionId = uuidv4();
// //     localStorage.setItem('curaAISessionId', newSessionId);
// //     return newSessionId;
// //   });
// //   const [prescriptionData, setPrescriptionData] = useState({
// //         patientName: '', patientAddress: '', patientDOB: '', patientAge: '',
// //         productInfo: 'Óleo Full Spectrum Cura Cannabis\n50mg/ml CBD\nÓleo Cura Cannabis',
// //         usageType: 'USO ORAL', isContinuousUse: true,
// //         dosageInstruction: 'Tomar X gotas, X vezes ao dia.',
// //         emissionDate: new Date().toLocaleDateString('pt-BR'),
// //   });
// //   const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  
// //   // Estado para configurações do médico
// //   const [doctorSettings, setDoctorSettings] = useState(() => {
// //     const savedSettings = localStorage.getItem('curaAIDoctorSettings');
// //     return savedSettings ? JSON.parse(savedSettings) : {
// //       doctorName: '',
// //       crm: '',
// //       phone: '',
// //       address: '',
// //       logo: ''
// //     };
// //   });
// //   const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

// //   // --- Refs ---
// //   const messagesEndRef = useRef(null);
// //   const inputRef = useRef(null);

// //   // --- API URLs ---
// //   const CHAT_URL = 'http://localhost:3001/api/chat';
// //   const STREAM_URL = 'http://localhost:3001/api/stream';
// //   const CLEAR_SESSION_URL = 'http://localhost:3001/api/clear-session';

// //   // --- Callbacks ---
// //   const scrollToBottom = useCallback(() => {
// //     setTimeout(() => { 
// //       if (messagesEndRef.current) {
// //         messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
// //         // Tenta novamente após um tempo maior caso a primeira tentativa falhe
// //         setTimeout(() => {
// //           messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
// //         }, 300);
// //       }
// //     }, 100);
// //   }, []);
  
// //   const handleInputChange = (e) => { setInputValue(e.target.value); };
// //   const validationCheck = useCallback((str) => str === null || str.match(/^\s*$/) !== null, []);
// //   const toggleStreamingMode = useCallback(() => { setIsStreamingMode(prev => !prev); }, []);
// //   const handlePrescriptionChange = useCallback((event) => {
// //       const { name, value } = event.target;
// //       setPrescriptionData(prevData => ({ ...prevData, [name]: value }));
// //   }, []);

// //   // Modal control functions
// //   const openPrescriptionModal = useCallback(() => {
// //     setIsPrescriptionModalOpen(true);
// //   }, []);
  
// //   const closePrescriptionModal = useCallback(() => {
// //     setIsPrescriptionModalOpen(false);
// //   }, []);
  
// //   // Funções para controle do modal de configurações
// //   const openSettingsModal = useCallback(() => {
// //     setIsSettingsModalOpen(true);
// //   }, []);
  
// //   const closeSettingsModal = useCallback(() => {
// //     setIsSettingsModalOpen(false);
// //   }, []);

// //   // Função para criar nova sessão
// //   const createNewSession = useCallback(() => {
// //     const newSessionId = uuidv4();
// //     setSessionId(newSessionId);
// //     localStorage.setItem('curaAISessionId', newSessionId);
// //     return newSessionId;
// //   }, []);

// //   // Função para limpar histórico de conversa
// //   const clearConversation = useCallback(async () => {
// //     setIsThinking(true);
    
// //     try {
// //       // Limpa a sessão atual no backend
// //       const response = await fetch(CLEAR_SESSION_URL, {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ sessionId })
// //       });
      
// //       if (!response.ok) {
// //         throw new Error(`HTTP error! status: ${response.status}`);
// //       }
      
// //       // Limpa as mensagens locais
// //       setMessages([
// //         { 
// //           id: 'welcome', 
// //           text: 'Conversa limpa. Como posso ajudar você hoje?', 
// //           sender: 'ai', 
// //           timestamp: new Date(), 
// //           type: 'info', 
// //           isComplete: true 
// //         }
// //       ]);
      
// //       console.log('Conversa limpa com sucesso!');
// //     } catch (error) {
// //       console.error("Erro ao limpar conversa:", error);
// //       setMessages(prev => [
// //         ...prev,
// //         { 
// //           id: `error-${Date.now()}`, 
// //           text: `Erro ao limpar conversa: ${error.message}`, 
// //           sender: 'ai', 
// //           timestamp: new Date(), 
// //           type: 'error', 
// //           isComplete: true 
// //         }
// //       ]);
// //     } finally {
// //       setIsThinking(false);
// //     }
// //   }, [sessionId, CLEAR_SESSION_URL]);

// //   // --- Process Function Results ---
// //   // Observa resultados de função para atualizar o receituário
// //   useEffect(() => {
// //     // Procura pelo resultado mais recente da função fill_prescription
// //     const latestFunctionCall = [...messages].reverse().find(
// //       msg => msg.type === 'functionCall' && 
// //       msg.functionCallInfo && 
// //       msg.functionCallInfo.name === 'fill_prescription' &&
// //       msg.functionCallInfo.args
// //     );
    
// //     // Procura o resultado correspondente à chamada
// //     const latestFunctionResult = [...messages].reverse().find(
// //       msg => msg.type === 'functionResult' && 
// //       msg.functionResultInfo && 
// //       msg.functionResultInfo.name === 'fill_prescription' &&
// //       msg.functionResultInfo.result &&
// //       msg.functionResultInfo.result.success
// //     );
    
// //     // Se temos tanto a chamada quanto o resultado com sucesso
// //     if (latestFunctionCall && latestFunctionResult) {
// //       const args = latestFunctionCall.functionCallInfo.args;
      
// //       // Atualiza os dados do receituário com os argumentos da chamada
// //       setPrescriptionData(prevData => ({
// //         ...prevData,
// //         productInfo: args.productDetails || prevData.productInfo,
// //         dosageInstruction: args.dosageInstruction || prevData.dosageInstruction,
// //         // Valores fixos
// //         usageType: "USO ORAL",
// //         emissionDate: new Date().toLocaleDateString('pt-BR'), // Sempre usa a data atual
// //         // Atualiza uso contínuo apenas se fornecido
// //         ...(args.isContinuousUse !== null ? { isContinuousUse: args.isContinuousUse } : {})
// //       }));
      
// //       // Abre o modal do receituário automaticamente
// //       setIsPrescriptionModalOpen(true);
// //     }
// //   }, [messages]);

// //   // --- Chat Handlers ---
// //   const handleNonStreamingChat = useCallback(async () => {
// //     const messageToSend = inputValue;
// //     const userMessage = { 
// //       id: `user-${Date.now()}`, 
// //       text: messageToSend, 
// //       sender: 'user', 
// //       timestamp: new Date(), 
// //       type: 'user', 
// //       isComplete: true 
// //     };
    
// //     flushSync(() => { 
// //       setMessages(prev => [...prev, userMessage]); 
// //       setInputValue(""); 
// //       setIsThinking(true); 
// //     });
    
// //     try {
// //       // Envia apenas a mensagem atual e o sessionId - o histórico é mantido no backend
// //       const response = await fetch(CHAT_URL, { 
// //         method: 'POST', 
// //         headers: { 'Content-Type': 'application/json' }, 
// //         body: JSON.stringify({ 
// //           chat: messageToSend, 
// //           sessionId: sessionId 
// //         }) 
// //       });
      
// //       if (!response.ok) { 
// //         const errorBody = await response.text(); 
// //         throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); 
// //       }
      
// //       const result = await response.json();
// //       const aiMessage = { 
// //         id: `ai-${Date.now()}`, 
// //         text: result.text, 
// //         sender: 'ai', 
// //         timestamp: new Date(), 
// //         type: 'ai', 
// //         isComplete: true 
// //       };
      
// //       flushSync(() => { 
// //         setMessages(prev => [...prev, aiMessage]); 
// //         setIsThinking(false); 
// //       });
// //     } catch (error) {
// //       console.error("Error in non-streaming chat:", error);
// //       const errorMessage = { 
// //         id: `error-${Date.now()}`, 
// //         text: `Erro: ${error.message || "Ocorreu um erro"}`, 
// //         sender: 'ai', 
// //         timestamp: new Date(), 
// //         type: 'error', 
// //         isComplete: true 
// //       };
      
// //       flushSync(() => { 
// //         setMessages(prev => [...prev, errorMessage]); 
// //         setIsThinking(false); 
// //       });
// //     }
// //   }, [inputValue, sessionId, CHAT_URL]);

// //   const handleStreamingChat = useCallback(async () => {
// //     const messageToSend = inputValue;
// //     const userMessage = { 
// //       id: `user-${Date.now()}`, 
// //       text: messageToSend, 
// //       sender: 'user', 
// //       timestamp: new Date(), 
// //       type: 'user', 
// //       isComplete: true 
// //     };

// //     flushSync(() => { 
// //       setMessages(prev => [...prev, userMessage]); 
// //       setInputValue(""); 
// //       setIsThinking(true); 
// //     });

// //     let currentStreamingId = null;
// //     let errorData = null;

// //     try {
// //       // Envia apenas a mensagem atual e o sessionId - o histórico é mantido no backend
// //       const response = await fetch(STREAM_URL, { 
// //         method: 'POST', 
// //         headers: { 'Content-Type': 'application/json' }, 
// //         body: JSON.stringify({ 
// //           chat: messageToSend, 
// //           sessionId: sessionId 
// //         }) 
// //       });
      
// //       if (!response.ok) { 
// //         const errorBody = await response.text(); 
// //         throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); 
// //       }
      
// //       if (!response.body) { 
// //         throw new Error("Response body is missing!"); 
// //       }

// //       const reader = response.body.getReader();
// //       const decoder = new TextDecoder();
// //       let buffer = '';

// //       while (true) {
// //         const { value, done } = await reader.read();
// //         if (done) { 
// //           console.log("Stream finished."); 
// //           break; 
// //         }

// //         buffer += decoder.decode(value, { stream: true });
// //         const lines = buffer.split('\n');
// //         buffer = lines.pop() || '';

// //         for (const line of lines) {
// //           if (line.trim() === '') continue;
// //           try {
// //             const parsed = JSON.parse(line);
// //             console.log("Received:", parsed);

// //             // eslint-disable-next-line no-loop-func
// //             flushSync(() => {
// //               if (parsed.type === 'text') {
// //                 setIsThinking(false);
// //                 setMessages(prevMessages => {
// //                   const lastMessage = prevMessages[prevMessages.length - 1];
// //                   if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') {
// //                     return prevMessages.map(msg => 
// //                       msg.id === currentStreamingId 
// //                         ? { ...msg, text: msg.text + parsed.data, timestamp: new Date() } 
// //                         : msg
// //                     );
// //                   } else {
// //                     const newStreamingMsg = { 
// //                       id: `ai-stream-${Date.now()}`, 
// //                       text: parsed.data, 
// //                       sender: 'ai', 
// //                       timestamp: new Date(), 
// //                       type: 'ai_streaming', 
// //                       isStreaming: true 
// //                     };
// //                     currentStreamingId = newStreamingMsg.id;
// //                     return [...prevMessages, newStreamingMsg];
// //                   }
// //                 });
// //               } else if (parsed.type === 'functionCall') {
// //               setIsThinking(false);
// //               const iteration = parsed.data.iteration || 1;
// //               const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : '';
// //               const functionCallMessage = { 
// //               id: `fc-${Date.now()}`, 
// //               type: 'functionCall', 
// //               sender: 'ai', 
// //               timestamp: new Date(), 
// //               functionCallInfo: parsed.data,
// //                 iteration: iteration,
// //                 // Adicione texto para exibição na UI com indicador de iteração
// //                 text: `🛠️ ${iterationPrefix}Chamando Função: ${parsed.data.name}\n${JSON.stringify(parsed.data.args, null, 2)}`
// //                 };
// //               setMessages(prev => [...prev, functionCallMessage]);
// //               currentStreamingId = null;
// //               } else if (parsed.type === 'functionResult') {
// //               setIsThinking(false);
// //               const iteration = parsed.data.iteration || 1;
// //               const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : '';
// //               const functionResultMessage = { 
// //               id: `fr-${Date.now()}`, 
// //               type: 'functionResult', 
// //                 sender: 'ai', 
// //                 timestamp: new Date(), 
// //                 functionResultInfo: parsed.data,
// //                     iteration: iteration,
// //                     // Adicione texto para exibição na UI com indicador de iteração
// //                     text: `✅ ${iterationPrefix}Resultado (${parsed.data.name}):\n${JSON.stringify(parsed.data.result, null, 2)}`
// //                   };
// //                   setMessages(prev => [...prev, functionResultMessage]);
// //                   currentStreamingId = null;
// //               } else if (parsed.type === 'info') {
// //                   setIsThinking(false);
// //                   const infoMessage = { 
// //                     id: `info-${Date.now()}`, 
// //                     text: `ℹ️ ${parsed.data}`, 
// //                     sender: 'ai', 
// //                     timestamp: new Date(), 
// //                     type: 'info', 
// //                     isComplete: true 
// //                   };
// //                   setMessages(prev => [...prev, infoMessage]);
// //                 } else if (parsed.type === 'error') {
// //                 console.error("Stream error from backend:", parsed.data);
// //                 errorData = parsed.data;
// //                 setIsThinking(false);
// //                 const errorMsg = { 
// //                   id: `error-${Date.now()}`, 
// //                   text: `Erro: ${errorData}`, 
// //                   sender: 'ai', 
// //                   timestamp: new Date(), 
// //                   type: 'error', 
// //                   isComplete: true 
// //                 };
// //                 setMessages(prev => [...prev, errorMsg]);
// //               }
// //             }); // End flushSync
// //           } catch (e) {
// //             console.error("Failed to parse JSON line:", line, e);
// //             errorData = "Erro ao processar dados recebidos.";
// //             // eslint-disable-next-line no-loop-func
// //             flushSync(() => { 
// //               setIsThinking(false); 
// //               const errorMsg = { 
// //                 id: `error-${Date.now()}`, 
// //                 text: `Erro: ${errorData}`, 
// //                 sender: 'ai', 
// //                 timestamp: new Date(), 
// //                 type: 'error', 
// //                 isComplete: true 
// //               }; 
// //               setMessages(prev => [...prev, errorMsg]); 
// //             });
// //           }
// //         } // end for loop (lines)
// //       } // end while loop (reader)

// //       flushSync(() => { // Finalize state after loop
// //         if (!errorData) {
// //           setMessages(prevMessages => {
// //             const lastMessage = prevMessages[prevMessages.length - 1];
// //             if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') {
// //               return prevMessages.map(msg => 
// //                 msg.id === currentStreamingId 
// //                   ? { ...msg, type: 'ai', isStreaming: false, isComplete: true } 
// //                   : msg
// //               );
// //             }
// //             return prevMessages;
// //           });
// //         }
// //         setIsThinking(false);
// //       });

// //     } catch (error) {
// //       console.error("Error in streaming chat fetch:", error);
// //       const errorMsg = { 
// //         id: `error-${Date.now()}`, 
// //         text: `Erro: ${error.message || "Ocorreu um erro na comunicação"}`, 
// //         sender: 'ai', 
// //         timestamp: new Date(), 
// //         type: 'error', 
// //         isComplete: true 
// //       };
      
// //       flushSync(() => { 
// //         setMessages(prev => [...prev, errorMsg]); 
// //         setIsThinking(false); 
// //       });
// //     }
// //   }, [inputValue, sessionId, STREAM_URL]);

// //   const handleClick = useCallback(() => {
// //     if (validationCheck(inputValue)) { 
// //       console.log("Empty or invalid entry"); 
// //     } else { 
// //       if (!isStreamingMode) {
// //         handleNonStreamingChat();
// //       } else {
// //         handleStreamingChat();
// //       } 
// //     }
// //   }, [inputValue, isStreamingMode, validationCheck, handleNonStreamingChat, handleStreamingChat]);

// //   const handleKeyDown = useCallback((e) => {
// //     if (e.key === 'Enter' && !e.shiftKey) { 
// //       e.preventDefault(); 
// //       handleClick(); 
// //     }
// //   }, [handleClick]);

// //   useEffect(() => { 
// //     // Scroll para o fim quando novas mensagens são adicionadas
// //     scrollToBottom();
    
// //     // Garante que o container de chat é rolável
// //     const chatContainer = document.querySelector('.chat-container');
// //     if (chatContainer) {
// //       chatContainer.style.overflowY = 'auto';
// //     }
// //   }, [messages, scrollToBottom]); // Scroll on messages change

// //   // Componente personalizado para a barra de ferramentas com botão de limpar
// //   const EnhancedChatToolbar = useCallback(
// //     ({ isStreamingMode, toggleStreamingMode, openPrescriptionModal, openSettingsModal }) => (
// //       <ChatToolbar 
// //         isStreamingMode={isStreamingMode} 
// //         toggleStreamingMode={toggleStreamingMode} 
// //         openPrescriptionModal={openPrescriptionModal}
// //         openSettingsModal={openSettingsModal}
// //       >
// //         <ClearButton onClick={clearConversation} disabled={isThinking || messages.length <= 1}>
// //           Limpar Conversa
// //         </ClearButton>
// //       </ChatToolbar>
// //     ),
// //     [clearConversation, isThinking, messages.length]
// //   );

// //   // --- Render ---
// //   return (
// //     <ThemeProvider theme={theme}>
// //       <GlobalStyle />
// //       <MainContainer>
// //         {/* Header */}
// //         <Header />
        
// //         {/* Toolbar com controles */}
// //         <EnhancedChatToolbar 
// //           isStreamingMode={isStreamingMode} 
// //           toggleStreamingMode={toggleStreamingMode} 
// //           openPrescriptionModal={openPrescriptionModal} 
// //           openSettingsModal={openSettingsModal}
// //         />
        
// //         {/* Chat Container */}
// //         <ChatContainer>
// //           {/* Chat Content */}
// //           <ChatContent
// //             messages={messages}
// //             isThinking={isThinking}
// //             messagesEndRef={messagesEndRef}
// //             Message={Message}
// //             ThinkingIndicator={ThinkingIndicator}
// //           />
// //         </ChatContainer>

// //         {/* Input Area */}
// //         <InputContainer
// //           value={inputValue} 
// //           onChange={handleInputChange} 
// //           onKeyDown={handleKeyDown}
// //           onSend={handleClick} 
// //           disabled={isThinking} 
// //           ref={inputRef}
// //         />
        
// //         {/* Prescription Modal */}
// //         <PrescriptionModal 
// //           isOpen={isPrescriptionModalOpen}
// //           onClose={closePrescriptionModal}
// //           prescriptionData={prescriptionData}
// //           handlePrescriptionChange={handlePrescriptionChange}
// //           doctorSettings={doctorSettings}
// //         />
        
// //         {/* Settings Modal */}
// //         <SettingsModal
// //           isOpen={isSettingsModalOpen}
// //           onClose={closeSettingsModal}
// //           doctorSettings={doctorSettings}
// //           setDoctorSettings={setDoctorSettings}
// //         />
// //       </MainContainer>
// //       <Footer />
// //     </ThemeProvider>
// //   );
// // }

// // export default App;


// // App.js - Arquivo principal com integração ao sistema de memória do backend

// import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { flushSync } from 'react-dom';
// import { ThemeProvider } from 'styled-components';
// import styled from 'styled-components';
// import { theme, GlobalStyle } from './theme'; //
// import { Header } from './components/Header'; //
// import { ChatContainer } from './components/ChatContainer'; //
// import { InputContainer } from './components/InputContainer'; //
// import { Footer } from './components/Footer'; //
// import { ThinkingIndicator } from './components/ThinkingIndicator'; //
// import { Message } from './components/Message'; //
// import { ChatToolbar, ChatContent, ActionButton } from './ChatSection'; //
// import { PrescriptionModal } from './PrescriptionModal'; //
// import { SettingsModal } from './SettingsModal'; //
// // Assumindo que uuid foi instalado: npm install uuid
// import { v4 as uuidv4 } from 'uuid'; //

// // --- Styled Components ---
// const MainContainer = styled.main`
//   display: flex;
//   flex-direction: column;
//   height: 100vh;
//   width: 100%;
//   position: relative;
// `; //

// const ClearButton = styled(ActionButton)` //
//   background-color: ${props => props.theme.colors.secondary || '#60a5fa'}; //
//   margin-left: 10px; //

//   &:hover:not(:disabled) { //
//     background-color: ${props => props.theme.colors.secondaryDark || '#3b82f6'}; // Use uma cor mais escura ou fallback //
//     transform: none; // Remove transform para consistência com ActionButton //
//     box-shadow: none; //
//   }

//    &:disabled { //
//      opacity: 0.6; //
//      cursor: not-allowed; //
//    }
// `;

// // --- App Component ---
// function App() { //
//   // --- State ---
//   const [messages, setMessages] = useState([ //
//     { id: 'welcome', text: 'Olá! Eu sou o CuraAI, seu assistente de saúde. Como posso ajudar você hoje?', sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true } //
//   ]);
//   const [inputValue, setInputValue] = useState(''); //
//   const [isThinking, setIsThinking] = useState(false); //
//   const [isStreamingMode, setIsStreamingMode] = useState(true); //
//   const [sessionId, setSessionId] = useState(() => { //
//     const savedSessionId = localStorage.getItem('curaAISessionId'); //
//     if (savedSessionId) return savedSessionId; //
//     const newSessionId = uuidv4(); //
//     localStorage.setItem('curaAISessionId', newSessionId); //
//     return newSessionId; //
//   });

//   const [prescriptionData, setPrescriptionData] = useState({ //
//         patientName: '', patientAddress: '', patientDOB: '', patientAge: '', //
//         productInfo: '', //
//         usageType: 'USO ORAL', //
//         isContinuousUse: false, //
//         dosageInstruction: '', //
//         justification: '', //
//         emissionDate: new Date().toLocaleDateString('pt-BR'), //
//   });
//   const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false); //

//   const [doctorSettings, setDoctorSettings] = useState(() => { //
//     const savedSettings = localStorage.getItem('curaAIDoctorSettings'); //
//     return savedSettings ? JSON.parse(savedSettings) : { //
//       doctorName: '', crm: '', phone: '', address: '', logo: '' //
//     };
//   });
//   const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); //

//   // --- Refs ---
//   const messagesEndRef = useRef(null); //
//   const inputRef = useRef(null); //

//   // --- API URLs ---
//   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'; //
//   const CHAT_URL = `${API_BASE_URL}/chat`; //
//   const STREAM_URL = `${API_BASE_URL}/stream`; //
//   const CLEAR_SESSION_URL = `${API_BASE_URL}/clear-session`; //

//   // --- Callbacks ---
//   const scrollToBottom = useCallback(() => { //
//     setTimeout(() => {  //
//        if (messagesEndRef.current) { //
//          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); //
//          setTimeout(() => { //
//            messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }); //
//          }, 300); //
//        }
//      }, 100); //
//   }, []);

//   const handleInputChange = (e) => { setInputValue(e.target.value); }; //
//   const validationCheck = useCallback((str) => str === null || str.match(/^\s*$/) !== null, []); //
//   const toggleStreamingMode = useCallback(() => { setIsStreamingMode(prev => !prev); }, []); //

//   const handlePrescriptionChange = useCallback((event) => { //
//      const { name, value, type, checked } = event.target; //
//      setPrescriptionData(prevData => ({ //
//        ...prevData, //
//        [name]: type === 'checkbox' ? checked : value //
//      }));
//   }, []);

//   const openPrescriptionModal = useCallback(() => { setIsPrescriptionModalOpen(true); }, []); //
//   const closePrescriptionModal = useCallback(() => { setIsPrescriptionModalOpen(false); }, []); //
//   const openSettingsModal = useCallback(() => { setIsSettingsModalOpen(true); }, []); //
//   const closeSettingsModal = useCallback(() => { setIsSettingsModalOpen(false); }, []); //

//   const createNewSession = useCallback(() => { //
//     const newSessionId = uuidv4(); //
//      setSessionId(newSessionId); //
//      localStorage.setItem('curaAISessionId', newSessionId); //
//      setMessages([{ id: 'welcome', text: 'Nova sessão iniciada. Como posso ajudar?', sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true }]); //
//      setPrescriptionData({ //
//         patientName: '', patientAddress: '', patientDOB: '', patientAge: '', //
//         productInfo: '', usageType: 'USO ORAL', isContinuousUse: false, //
//         dosageInstruction: '', justification: '', //
//         emissionDate: new Date().toLocaleDateString('pt-BR'), //
//      });
//      return newSessionId; //
//   }, []);

//   const clearConversation = useCallback(async () => { //
//     setIsThinking(true); //
//      try { //
//        const currentSessionId = sessionId; //
//        const response = await fetch(CLEAR_SESSION_URL, { //
//          method: 'POST', //
//          headers: { 'Content-Type': 'application/json' }, //
//          body: JSON.stringify({ sessionId: currentSessionId }) //
//        });
//        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); //
//        createNewSession(); //
//        console.log(`Sessão ${currentSessionId} limpa e nova sessão criada.`); //
//      } catch (error) { //
//        console.error("Erro ao limpar conversa:", error); //
//        setMessages(prev => [...prev, { id: `error-${Date.now()}`, text: `Erro ao limpar conversa no servidor: ${error.message}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }]); //
//      } finally { //
//        setIsThinking(false); //
//      }
//   }, [sessionId, CLEAR_SESSION_URL, createNewSession]); //


//   // --- Process Function Results (CORRIGIDO para verificar apenas a ÚLTIMA mensagem) ---
//   useEffect(() => { //
//     if (messages.length === 0) return; // Sai se não houver mensagens

//     // Pega a última mensagem adicionada ao array
//     const lastMessage = messages[messages.length - 1]; //

//     // Verifica se a ÚLTIMA mensagem é um resultado bem-sucedido de fill_prescription
//     if (
//       lastMessage?.type === 'functionResult' && //
//       lastMessage.functionResultInfo?.name === 'fill_prescription' && //
//       lastMessage.functionResultInfo?.result?.success === true && //
//       lastMessage.functionResultInfo?.result?.filledData //
//     ) {
//       const resultData = lastMessage.functionResultInfo.result.filledData; // Pega dados retornados pela tool //

//       // Atualiza os dados do receituário e ABRE O MODAL
//       flushSync(() => { //
//           setPrescriptionData(prevData => ({ //
//             ...prevData, //
//             productInfo: resultData.productDetails || prevData.productInfo, //
//             dosageInstruction: resultData.dosageInstruction || prevData.dosageInstruction, //
//             justification: resultData.justification || '', // Atualiza justification //
//             usageType: resultData.usageType || "USO ORAL", //
//             emissionDate: new Date().toLocaleDateString('pt-BR'), //
//             ...( ('isContinuousUse' in resultData) ? { isContinuousUse: resultData.isContinuousUse } : {}) //
//           }));
//          // Abre o modal SOMENTE se a última mensagem for o resultado correto
//          setIsPrescriptionModalOpen(true); //
//        });
//     }
//   // Só depende de 'messages' para rodar quando mensagens mudam
//   }, [messages]); //


//   // --- Chat Handlers (handleNonStreamingChat e handleStreamingChat - Nenhuma mudança interna necessária) ---
//    const handleNonStreamingChat = useCallback(async () => { //
//      const messageToSend = inputValue; //
//      const userMessage = { id: `user-${Date.now()}`, text: messageToSend, sender: 'user', timestamp: new Date(), type: 'user', isComplete: true }; //
//      flushSync(() => { setMessages(prev => [...prev, userMessage]); setInputValue(""); setIsThinking(true); }); //
//      try { //
//        const response = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat: messageToSend, sessionId: sessionId }) }); //
//        if (!response.ok) { const errorBody = await response.text(); throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); } //
//        const result = await response.json(); //
//        const aiMessage = { id: `ai-${Date.now()}`, text: result.text, sender: 'ai', timestamp: new Date(), type: 'ai', isComplete: true }; //
//        flushSync(() => { setMessages(prev => [...prev, aiMessage]); setIsThinking(false); }); //
//      } catch (error) { //
//        console.error("Error in non-streaming chat:", error); //
//        const errorMessage = { id: `error-${Date.now()}`, text: `Erro: ${error.message || "Ocorreu um erro"}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
//        flushSync(() => { setMessages(prev => [...prev, errorMessage]); setIsThinking(false); }); //
//      }
//    }, [inputValue, sessionId, CHAT_URL]); //

//    const handleStreamingChat = useCallback(async () => { //
//      const messageToSend = inputValue; //
//      const userMessage = { id: `user-${Date.now()}`, text: messageToSend, sender: 'user', timestamp: new Date(), type: 'user', isComplete: true }; //
//      flushSync(() => { setMessages(prev => [...prev, userMessage]); setInputValue(""); setIsThinking(true); }); //
//      let currentStreamingId = null; //
//      let errorData = null; //
//      try { //
//        const response = await fetch(STREAM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat: messageToSend, sessionId: sessionId }) }); //
//        if (!response.ok) { const errorBody = await response.text(); throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); } //
//        if (!response.body) { throw new Error("Response body is missing!"); } //
//        const reader = response.body.getReader(); //
//        const decoder = new TextDecoder(); //
//        let buffer = ''; //
//        while (true) { //
//          const { value, done } = await reader.read(); //
//          if (done) { console.log("Stream finished."); break; } //
//          buffer += decoder.decode(value, { stream: true }); //
//          const lines = buffer.split('\n'); //
//          buffer = lines.pop() || ''; //
//          for (const line of lines) { //
//            if (line.trim() === '') continue; //
//            try { //
//              const parsed = JSON.parse(line); //
//              console.log("Received:", parsed); //
//              // eslint-disable-next-line no-loop-func
//              flushSync(() => { //
//                setIsThinking(false); // Recebeu algo, não está mais "só pensando" //
//                if (parsed.type === 'text') { //
//                  setMessages(prevMessages => { //
//                    const lastMessage = prevMessages[prevMessages.length - 1]; //
//                    if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') { //
//                      return prevMessages.map(msg => msg.id === currentStreamingId ? { ...msg, text: msg.text + parsed.data, timestamp: new Date() } : msg); //
//                    } else { //
//                      // Marca a mensagem anterior como completa se existir e for streaming
//                      const updatedMessages = prevMessages.map(msg => //
//                        (msg.id === currentStreamingId && msg.type === 'ai_streaming') //
//                          ? { ...msg, isStreaming: false, isComplete: true } //
//                          : msg //
//                      );
//                      const newStreamingMsg = { id: `ai-stream-${Date.now()}`, text: parsed.data, sender: 'ai', timestamp: new Date(), type: 'ai_streaming', isStreaming: true, isComplete: false }; //
//                      currentStreamingId = newStreamingMsg.id; //
//                      return [...updatedMessages, newStreamingMsg]; //
//                    }
//                  });
//                } else if (parsed.type === 'functionCall') { //
//                   // Marca a mensagem de streaming anterior como completa
//                   setMessages(prev => prev.map(msg => //
//                     (msg.id === currentStreamingId && msg.type === 'ai_streaming') //
//                     ? { ...msg, isStreaming: false, isComplete: true } //
//                     : msg //
//                   ));
//                  currentStreamingId = null; // Reseta ID de streaming //
//                  const iteration = parsed.data.iteration || 1; //
//                  const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; //
//                  const functionCallMessage = { id: `fc-${Date.now()}-${iteration}`, type: 'functionCall', sender: 'ai', timestamp: new Date(), functionCallInfo: parsed.data, iteration: iteration, text: `🛠️ ${iterationPrefix}Chamando Função: ${parsed.data.name}\n${JSON.stringify(parsed.data.args, null, 2)}` }; //
//                  setMessages(prev => [...prev, functionCallMessage]); //
//                } else if (parsed.type === 'functionResult') { //
//                   // Marca a mensagem de streaming anterior como completa
//                   setMessages(prev => prev.map(msg => //
//                     (msg.id === currentStreamingId && msg.type === 'ai_streaming') //
//                     ? { ...msg, isStreaming: false, isComplete: true } //
//                     : msg //
//                   ));
//                  currentStreamingId = null; // Reseta ID de streaming //
//                  const iteration = parsed.data.iteration || 1; //
//                  const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; //
//                  const functionResultMessage = { id: `fr-${Date.now()}-${iteration}`, type: 'functionResult', sender: 'ai', timestamp: new Date(), functionResultInfo: parsed.data, iteration: iteration, text: `✅ ${iterationPrefix}Resultado (${parsed.data.name}):\n${JSON.stringify(parsed.data.result, null, 2)}` }; //
//                  setMessages(prev => [...prev, functionResultMessage]); //
//                } else if (parsed.type === 'info') { //
//                   // Marca a mensagem de streaming anterior como completa
//                   setMessages(prev => prev.map(msg => //
//                     (msg.id === currentStreamingId && msg.type === 'ai_streaming') //
//                     ? { ...msg, isStreaming: false, isComplete: true } //
//                     : msg //
//                   ));
//                  currentStreamingId = null; // Reseta ID de streaming //
//                  const infoMessage = { id: `info-${Date.now()}`, text: `ℹ️ ${parsed.data}`, sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true }; //
//                  setMessages(prev => [...prev, infoMessage]); //
//                } else if (parsed.type === 'error') { //
//                  console.error("Stream error from backend:", parsed.data); //
//                  errorData = parsed.data; //
//                   // Marca a mensagem de streaming anterior como completa
//                   setMessages(prev => prev.map(msg => //
//                     (msg.id === currentStreamingId && msg.type === 'ai_streaming') //
//                     ? { ...msg, isStreaming: false, isComplete: true } //
//                     : msg //
//                   ));
//                  currentStreamingId = null; // Reseta ID de streaming //
//                  const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${errorData}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
//                  setMessages(prev => [...prev, errorMsg]); //
//                }
//              }); // End flushSync
//            } catch (e) { //
//              console.error("Failed to parse JSON line:", line, e); //
//              errorData = "Erro ao processar dados recebidos."; //
//              // eslint-disable-next-line no-loop-func
//              flushSync(() => { setIsThinking(false); const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${errorData}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; setMessages(prev => [...prev, errorMsg]); }); //
//            }
//          } // end for loop (lines)
//        } // end while loop (reader)
//        flushSync(() => { // Finalize state after loop //
//          if (!errorData) { //
//            setMessages(prevMessages => { //
//              const lastMessage = prevMessages[prevMessages.length - 1]; //
//              if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') { //
//                // Marca a última mensagem de streaming como completa
//                return prevMessages.map(msg => //
//                  msg.id === currentStreamingId //
//                    ? { ...msg, type: 'ai', isStreaming: false, isComplete: true } //
//                    : msg //
//                );
//              }
//              return prevMessages; // Nenhuma alteração necessária se não terminou com streaming //
//            });
//          }
//          setIsThinking(false); // Garante que thinking seja false no final, mesmo com erro //
//        });
//      } catch (error) { //
//        console.error("Error in streaming chat fetch:", error); //
//        const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${error.message || "Ocorreu um erro na comunicação"}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
//        flushSync(() => { setMessages(prev => [...prev, errorMsg]); setIsThinking(false); }); //
//      }
//    }, [inputValue, sessionId, STREAM_URL]); //

//    const handleClick = useCallback(() => { //
//     if (validationCheck(inputValue)) return; //
//     if (isStreamingMode) { //
//       handleStreamingChat(); //
//     } else { //
//       handleNonStreamingChat(); //
//     }
//    }, [inputValue, isStreamingMode, validationCheck, handleNonStreamingChat, handleStreamingChat]); //

//   const handleKeyDown = useCallback((e) => { //
//     if (e.key === 'Enter' && !e.shiftKey) { //
//       e.preventDefault(); //
//       handleClick(); //
//     }
//   }, [handleClick]); //

//   useEffect(() => { //
//     scrollToBottom(); //
//      const chatContainer = document.querySelector('.chat-container'); //
//      if (chatContainer) { chatContainer.style.overflowY = 'auto'; } //
//    }, [messages, scrollToBottom]); //

//   // --- Toolbar Component ---
//   const AppToolbar = () => ( //
//      <ChatToolbar //
//        isStreamingMode={isStreamingMode} //
//        toggleStreamingMode={toggleStreamingMode} //
//        openPrescriptionModal={openPrescriptionModal} //
//        openSettingsModal={openSettingsModal} //
//      >
//        <ClearButton onClick={clearConversation} disabled={isThinking || messages.length <= 1}> {/* */}
//          Limpar Conversa
//        </ClearButton>
//      </ChatToolbar> //
//    );

//   // --- Render ---
//   return ( //
//     <ThemeProvider theme={theme}> {/* */}
//       <GlobalStyle /> {/* */}
//       <MainContainer> {/* */}
//         <Header /> {/* */}
//         <AppToolbar /> {/* */}
//         <ChatContainer> {/* */}
//           <ChatContent //
//             messages={messages} //
//             isThinking={isThinking} //
//             messagesEndRef={messagesEndRef} //
//             Message={Message} //
//             ThinkingIndicator={ThinkingIndicator} //
//           />
//         </ChatContainer> {/* */}
//         <InputContainer //
//           value={inputValue} //
//           onChange={handleInputChange} //
//           onKeyDown={handleKeyDown} //
//           onSend={handleClick} //
//           disabled={isThinking} //
//           ref={inputRef} //
//         />
//         <PrescriptionModal //
//           isOpen={isPrescriptionModalOpen} //
//           onClose={closePrescriptionModal} //
//           prescriptionData={prescriptionData} //
//           handlePrescriptionChange={handlePrescriptionChange} //
//           doctorSettings={doctorSettings} //
//         />
//         <SettingsModal //
//           isOpen={isSettingsModalOpen} //
//           onClose={closeSettingsModal} //
//           doctorSettings={doctorSettings} //
//           setDoctorSettings={setDoctorSettings} //
//         />
//       </MainContainer> {/* */}
//       <Footer /> {/* */}
//     </ThemeProvider> //
//   );
// }

// export default App; //



// App.js - Arquivo principal com integração ao sistema de memória do backend

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { theme, GlobalStyle } from './theme'; //
import { Header } from './components/Header'; //
import { ChatContainer } from './components/ChatContainer'; //
import { InputContainer } from './components/InputContainer'; //
import { Footer } from './components/Footer'; //
import { ThinkingIndicator } from './components/ThinkingIndicator'; //
import { Message } from './components/Message'; //
// Importa ChatToolbar, ChatContent, ActionButton, ToggleSwitch, ToggleLabel, ModeIndicator de ChatSection
import { ChatToolbar, ChatContent, ActionButton, ToggleSwitch, ToggleLabel, ModeIndicator, Toolbar, ToolbarControls } from './ChatSection'; //
import { PrescriptionModal } from './PrescriptionModal'; //
import { SettingsModal } from './SettingsModal'; //
import { v4 as uuidv4 } from 'uuid'; //

// --- Styled Components ---
const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  position: relative;
`; //

// ClearButton continua usando ActionButton como base
const ClearButton = styled(ActionButton)` //
  background-color: ${props => props.theme.colors.secondary || '#60a5fa'}; //
  margin-left: 10px; //

  &:hover:not(:disabled) { //
    background-color: ${props => props.theme.colors.secondaryDark || '#3b82f6'}; //
    transform: none; //
    box-shadow: none; //
  }

   &:disabled { //
     opacity: 0.6; //
     cursor: not-allowed; //
   }
`;

// --- App Component ---
function App() { //
  // --- State ---
  const [messages, setMessages] = useState([ //
    { id: 'welcome', text: 'Olá! Eu sou o CuraAI, seu assistente de saúde. Como posso ajudar você hoje?', sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true } //
  ]);
  const [inputValue, setInputValue] = useState(''); //
  const [isThinking, setIsThinking] = useState(false); //
  const [isStreamingMode, setIsStreamingMode] = useState(true); //
  const [sessionId, setSessionId] = useState(() => { //
    const savedSessionId = localStorage.getItem('curaAISessionId'); //
    if (savedSessionId) return savedSessionId; //
    const newSessionId = uuidv4(); //
    localStorage.setItem('curaAISessionId', newSessionId); //
    return newSessionId; //
  });

  const [prescriptionData, setPrescriptionData] = useState({ //
        patientName: '', patientAddress: '', patientDOB: '', patientAge: '', //
        productInfo: '', //
        usageType: 'USO ORAL', //
        isContinuousUse: false, //
        dosageInstruction: '', //
        justification: '', //
        emissionDate: new Date().toLocaleDateString('pt-BR'), //
  });
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false); //

  const [doctorSettings, setDoctorSettings] = useState(() => { //
    const savedSettings = localStorage.getItem('curaAIDoctorSettings'); //
    return savedSettings ? JSON.parse(savedSettings) : { //
      doctorName: '', crm: '', phone: '', address: '', logo: '' //
    };
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); //

  // --- Refs ---
  const messagesEndRef = useRef(null); //
  const inputRef = useRef(null); //

  // --- API URLs ---
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'; //
  const CHAT_URL = `${API_BASE_URL}/chat`; //
  const STREAM_URL = `${API_BASE_URL}/stream`; //
  const CLEAR_SESSION_URL = `${API_BASE_URL}/clear-session`; //

  // --- Callbacks ---
  const scrollToBottom = useCallback(() => { /* ... (sem mudanças) ... */ //
    setTimeout(() => {  //
       if (messagesEndRef.current) { //
         messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); //
         setTimeout(() => { //
           messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' }); //
         }, 300); //
       }
     }, 100); //
  }, []);

  const handleInputChange = (e) => { setInputValue(e.target.value); }; //
  const validationCheck = useCallback((str) => str === null || str.match(/^\s*$/) !== null, []); //
  const toggleStreamingMode = useCallback(() => { setIsStreamingMode(prev => !prev); }, []); //

  const handlePrescriptionChange = useCallback((event) => { //
     const { name, value, type, checked } = event.target; //
     setPrescriptionData(prevData => ({ //
       ...prevData, //
       [name]: type === 'checkbox' ? checked : value //
     }));
  }, []);

  const openPrescriptionModal = useCallback(() => { setIsPrescriptionModalOpen(true); }, []); //
  const closePrescriptionModal = useCallback(() => { setIsPrescriptionModalOpen(false); }, []); //
  const openSettingsModal = useCallback(() => { setIsSettingsModalOpen(true); }, []); //
  const closeSettingsModal = useCallback(() => { setIsSettingsModalOpen(false); }, []); //

  const createNewSession = useCallback(() => { //
    const newSessionId = uuidv4(); //
     setSessionId(newSessionId); //
     localStorage.setItem('curaAISessionId', newSessionId); //
     setMessages([{ id: 'welcome', text: 'Nova sessão iniciada. Como posso ajudar?', sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true }]); //
     setPrescriptionData({ //
        patientName: '', patientAddress: '', patientDOB: '', patientAge: '', //
        productInfo: '', usageType: 'USO ORAL', isContinuousUse: false, //
        dosageInstruction: '', justification: '', //
        emissionDate: new Date().toLocaleDateString('pt-BR'), //
     });
     return newSessionId; //
  }, []);

  const clearConversation = useCallback(async () => { //
    setIsThinking(true); //
     try { //
       const currentSessionId = sessionId; //
       const response = await fetch(CLEAR_SESSION_URL, { //
         method: 'POST', //
         headers: { 'Content-Type': 'application/json' }, //
         body: JSON.stringify({ sessionId: currentSessionId }) //
       });
       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); //
       createNewSession(); // Cria nova sessão e reseta o estado local //
       console.log(`Sessão ${currentSessionId} limpa e nova sessão criada.`); //
     } catch (error) { //
       console.error("Erro ao limpar conversa:", error); //
       setMessages(prev => [...prev, { id: `error-${Date.now()}`, text: `Erro ao limpar conversa no servidor: ${error.message}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }]); //
     } finally { //
       setIsThinking(false); //
     }
  }, [sessionId, CLEAR_SESSION_URL, createNewSession]); //


  // --- Process Function Results (Lógica para justification já adicionada) ---
  useEffect(() => { //
    if (messages.length === 0) return; //
    const lastMessage = messages[messages.length - 1]; //
    if ( //
      lastMessage?.type === 'functionResult' && //
      lastMessage.functionResultInfo?.name === 'fill_prescription' && //
      lastMessage.functionResultInfo?.result?.success === true && //
      lastMessage.functionResultInfo?.result?.filledData //
    ) {
      const resultData = lastMessage.functionResultInfo.result.filledData; //
      flushSync(() => { //
          setPrescriptionData(prevData => ({ //
            ...prevData, //
            productInfo: resultData.productDetails || prevData.productInfo, //
            dosageInstruction: resultData.dosageInstruction || prevData.dosageInstruction, //
            justification: resultData.justification || '', // Atualiza justification //
            usageType: resultData.usageType || "USO ORAL", //
            emissionDate: new Date().toLocaleDateString('pt-BR'), //
            ...( ('isContinuousUse' in resultData) ? { isContinuousUse: resultData.isContinuousUse } : {}) //
          }));
         setIsPrescriptionModalOpen(true); //
       });
    }
  }, [messages]); //


  // --- Chat Handlers (handleNonStreamingChat e handleStreamingChat - sem mudanças internas) ---
   const handleNonStreamingChat = useCallback(async () => { //
     const messageToSend = inputValue; //
     const userMessage = { id: `user-${Date.now()}`, text: messageToSend, sender: 'user', timestamp: new Date(), type: 'user', isComplete: true }; //
     flushSync(() => { setMessages(prev => [...prev, userMessage]); setInputValue(""); setIsThinking(true); }); //
     try { //
       const response = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat: messageToSend, sessionId: sessionId }) }); //
       if (!response.ok) { const errorBody = await response.text(); throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); } //
       const result = await response.json(); //
       const aiMessage = { id: `ai-${Date.now()}`, text: result.text, sender: 'ai', timestamp: new Date(), type: 'ai', isComplete: true }; //
       flushSync(() => { setMessages(prev => [...prev, aiMessage]); setIsThinking(false); }); //
     } catch (error) { //
       console.error("Error in non-streaming chat:", error); //
       const errorMessage = { id: `error-${Date.now()}`, text: `Erro: ${error.message || "Ocorreu um erro"}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
       flushSync(() => { setMessages(prev => [...prev, errorMessage]); setIsThinking(false); }); //
     }
   }, [inputValue, sessionId, CHAT_URL]); //

   const handleStreamingChat = useCallback(async () => { //
     const messageToSend = inputValue; //
     const userMessage = { id: `user-${Date.now()}`, text: messageToSend, sender: 'user', timestamp: new Date(), type: 'user', isComplete: true }; //
     flushSync(() => { setMessages(prev => [...prev, userMessage]); setInputValue(""); setIsThinking(true); }); //
     let currentStreamingId = null; //
     let errorData = null; //
     try { //
       const response = await fetch(STREAM_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat: messageToSend, sessionId: sessionId }) }); //
       if (!response.ok) { const errorBody = await response.text(); throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`); } //
       if (!response.body) { throw new Error("Response body is missing!"); } //
       const reader = response.body.getReader(); //
       const decoder = new TextDecoder(); //
       let buffer = ''; //
       while (true) { //
         const { value, done } = await reader.read(); //
         if (done) { console.log("Stream finished."); break; } //
         buffer += decoder.decode(value, { stream: true }); //
         const lines = buffer.split('\n'); //
         buffer = lines.pop() || ''; //
         for (const line of lines) { //
           if (line.trim() === '') continue; //
           try { //
             const parsed = JSON.parse(line); //
             console.log("Received:", parsed); //
             // eslint-disable-next-line no-loop-func
             flushSync(() => { //
               setIsThinking(false); //
               if (parsed.type === 'text') { //
                 setMessages(prevMessages => { //
                   const lastMessage = prevMessages[prevMessages.length - 1]; //
                   if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') { //
                     return prevMessages.map(msg => msg.id === currentStreamingId ? { ...msg, text: msg.text + parsed.data, timestamp: new Date() } : msg); //
                   } else { //
                     const updatedMessages = prevMessages.map(msg => //
                       (msg.id === currentStreamingId && msg.type === 'ai_streaming') ? { ...msg, isStreaming: false, isComplete: true } : msg //
                     );
                     const newStreamingMsg = { id: `ai-stream-${Date.now()}`, text: parsed.data, sender: 'ai', timestamp: new Date(), type: 'ai_streaming', isStreaming: true, isComplete: false }; //
                     currentStreamingId = newStreamingMsg.id; //
                     return [...updatedMessages, newStreamingMsg]; //
                   }
                 });
               } else if (parsed.type === 'functionCall') { //
                  setMessages(prev => prev.map(msg => (msg.id === currentStreamingId && msg.type === 'ai_streaming') ? { ...msg, isStreaming: false, isComplete: true } : msg )); //
                 currentStreamingId = null; //
                 const iteration = parsed.data.iteration || 1; //
                 const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; //
                 const functionCallMessage = { id: `fc-${Date.now()}-${iteration}`, type: 'functionCall', sender: 'ai', timestamp: new Date(), functionCallInfo: parsed.data, iteration: iteration, text: `🛠️ ${iterationPrefix}Chamando Função: ${parsed.data.name}\n${JSON.stringify(parsed.data.args, null, 2)}` }; //
                 setMessages(prev => [...prev, functionCallMessage]); //
               } else if (parsed.type === 'functionResult') { //
                  setMessages(prev => prev.map(msg => (msg.id === currentStreamingId && msg.type === 'ai_streaming') ? { ...msg, isStreaming: false, isComplete: true } : msg )); //
                 currentStreamingId = null; //
                 const iteration = parsed.data.iteration || 1; //
                 const iterationPrefix = iteration > 1 ? `[Iteração ${iteration}] ` : ''; //
                 const functionResultMessage = { id: `fr-${Date.now()}-${iteration}`, type: 'functionResult', sender: 'ai', timestamp: new Date(), functionResultInfo: parsed.data, iteration: iteration, text: `✅ ${iterationPrefix}Resultado (${parsed.data.name}):\n${JSON.stringify(parsed.data.result, null, 2)}` }; //
                 setMessages(prev => [...prev, functionResultMessage]); //
               } else if (parsed.type === 'info') { //
                  setMessages(prev => prev.map(msg => (msg.id === currentStreamingId && msg.type === 'ai_streaming') ? { ...msg, isStreaming: false, isComplete: true } : msg )); //
                 currentStreamingId = null; //
                 const infoMessage = { id: `info-${Date.now()}`, text: `ℹ️ ${parsed.data}`, sender: 'ai', timestamp: new Date(), type: 'info', isComplete: true }; //
                 setMessages(prev => [...prev, infoMessage]); //
               } else if (parsed.type === 'error') { //
                 console.error("Stream error from backend:", parsed.data); //
                 errorData = parsed.data; //
                  setMessages(prev => prev.map(msg => (msg.id === currentStreamingId && msg.type === 'ai_streaming') ? { ...msg, isStreaming: false, isComplete: true } : msg )); //
                 currentStreamingId = null; //
                 const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${errorData}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
                 setMessages(prev => [...prev, errorMsg]); //
               }
             }); // End flushSync
           } catch (e) { //
             console.error("Failed to parse JSON line:", line, e); //
             errorData = "Erro ao processar dados recebidos."; //
             // eslint-disable-next-line no-loop-func
             flushSync(() => { setIsThinking(false); const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${errorData}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; setMessages(prev => [...prev, errorMsg]); }); //
           }
         } // end for loop (lines)
       } // end while loop (reader)
       flushSync(() => { // Finalize state after loop //
         if (!errorData) { //
           setMessages(prevMessages => { //
             const lastMessage = prevMessages[prevMessages.length - 1]; //
             if (lastMessage && lastMessage.id === currentStreamingId && lastMessage.type === 'ai_streaming') { //
               return prevMessages.map(msg => msg.id === currentStreamingId ? { ...msg, type: 'ai', isStreaming: false, isComplete: true } : msg ); //
             }
             return prevMessages; //
           });
         }
         setIsThinking(false); //
       });
     } catch (error) { //
       console.error("Error in streaming chat fetch:", error); //
       const errorMsg = { id: `error-${Date.now()}`, text: `Erro: ${error.message || "Ocorreu um erro na comunicação"}`, sender: 'ai', timestamp: new Date(), type: 'error', isComplete: true }; //
       flushSync(() => { setMessages(prev => [...prev, errorMsg]); setIsThinking(false); }); //
     }
   }, [inputValue, sessionId, STREAM_URL]); //

   const handleClick = useCallback(() => { //
    if (validationCheck(inputValue)) return; //
    if (isStreamingMode) { //
      handleStreamingChat(); //
    } else { //
      handleNonStreamingChat(); //
    }
   }, [inputValue, isStreamingMode, validationCheck, handleNonStreamingChat, handleStreamingChat]); //

  const handleKeyDown = useCallback((e) => { //
    if (e.key === 'Enter' && !e.shiftKey) { //
      e.preventDefault(); //
      handleClick(); //
    }
  }, [handleClick]); //

  useEffect(() => { //
    scrollToBottom(); //
     const chatContainer = document.querySelector('.chat-container'); //
     if (chatContainer) { chatContainer.style.overflowY = 'auto'; } //
   }, [messages, scrollToBottom]); //

  // --- Toolbar Component (MODIFICADO PARA INCLUIR BOTÃO LIMPAR) ---
  const AppToolbar = () => ( //
     <Toolbar> {/* */}
       <ToolbarControls> {/* */}
         <ActionButton onClick={openPrescriptionModal} disabled={isThinking}> {/* */}
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg> {/* */}
           Abrir Receituário
         </ActionButton> {/* */}
         <ActionButton onClick={openSettingsModal} style={{ backgroundColor: '#4b5563' }} disabled={isThinking}> {/* */}
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> {/* */}
           Configurações
         </ActionButton> {/* */}
         {/* *** BOTÃO LIMPAR ADICIONADO AQUI *** */}
         <ClearButton onClick={clearConversation} disabled={isThinking || messages.length <= 1}> {/* */}
           Limpar Conversa
         </ClearButton>
       </ToolbarControls> {/* */}
       <div style={{ display: 'flex', alignItems: 'center' }}> {/* */}
            <ModeIndicator active={!isStreamingMode}>Normal</ModeIndicator> {/* */}
            <ToggleSwitch> <input type="checkbox" checked={isStreamingMode} onChange={toggleStreamingMode} /> <span /> </ToggleSwitch> {/* */}
            <ModeIndicator active={isStreamingMode}>Streaming</ModeIndicator> {/* */}
       </div> {/* */}
     </Toolbar> //
   );

  // --- Render ---
  return ( //
    <ThemeProvider theme={theme}> {/* */}
      <GlobalStyle /> {/* */}
      <MainContainer> {/* */}
        <Header /> {/* */}
        <AppToolbar /> {/* Renderiza a Toolbar com o botão Limpar */} {/* */}
        <ChatContainer> {/* */}
          <ChatContent //
            messages={messages} //
            isThinking={isThinking} //
            messagesEndRef={messagesEndRef} //
            Message={Message} //
            ThinkingIndicator={ThinkingIndicator} //
          />
        </ChatContainer> {/* */}
        <InputContainer //
          value={inputValue} //
          onChange={handleInputChange} //
          onKeyDown={handleKeyDown} //
          onSend={handleClick} //
          disabled={isThinking} //
          ref={inputRef} //
        />
        <PrescriptionModal //
          isOpen={isPrescriptionModalOpen} //
          onClose={closePrescriptionModal} //
          prescriptionData={prescriptionData} //
          handlePrescriptionChange={handlePrescriptionChange} //
          doctorSettings={doctorSettings} //
        />
        <SettingsModal //
          isOpen={isSettingsModalOpen} //
          onClose={closeSettingsModal} //
          doctorSettings={doctorSettings} //
          setDoctorSettings={setDoctorSettings} //
        />
      </MainContainer> {/* */}
      <Footer /> {/* */}
    </ThemeProvider> //
  );
}

export default App; //