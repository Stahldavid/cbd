// functionComponents.js - Componentes relacionados às chamadas de função

import React from 'react';
import styled from 'styled-components';

// Estilos para agrupar visualmente as chamadas de função sequenciais
const SequentialFunctionIndicator = styled.span`
  background-color: ${props => props.theme.colors.secondary};
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
  vertical-align: middle;
`;

// --- Function Call Display Component ---
const FunctionCallContainer = styled.div`
  background-color: ${props => props.theme.colors.functionCallBg}; 
  border: 1px solid ${props => props.theme.colors.functionCallBorder};
  border-radius: 8px; 
  padding: 0.75rem 1rem; 
  margin: 0.5rem 0 0.5rem 2.5rem; 
  font-size: 0.9rem; 
  color: ${props => props.theme.colors.functionCallText};
  align-self: flex-start; 
  max-width: 85%; 
  box-shadow: ${props => props.theme.shadows.main};
  
  strong { 
    color: ${props => props.theme.colors.functionCallHeading}; 
    font-weight: 600; 
  }
  
  pre { 
    background-color: ${props => props.theme.colors.functionCallCodeBg}; 
    border: 1px solid ${props => props.theme.colors.functionCallCodeBorder}; 
    padding: 0.5rem; 
    margin-top: 0.5rem; 
    border-radius: 4px; 
    white-space: pre-wrap; 
    word-break: break-all; 
    font-family: 'Courier New', Courier, monospace; 
    font-size: 0.85rem; 
    color: ${props => props.theme.colors.functionCallCodeText}; 
  }
`;

export function FunctionCallDisplay({ functionCallInfo }) {
  if (!functionCallInfo || !functionCallInfo.name) return null;
  
  // Usar a informação de iteração se disponível
  const iteration = functionCallInfo.iteration || 1;
  const showIterationIndicator = iteration > 1;
  
  return ( 
    <FunctionCallContainer> 
      <div>
        <strong>🛠️ Chamando Função:</strong> {functionCallInfo.name}
        {showIterationIndicator && <SequentialFunctionIndicator>Iteração {iteration}</SequentialFunctionIndicator>}
      </div> 
      {functionCallInfo.args && (<pre>{JSON.stringify(functionCallInfo.args, null, 2)}</pre>)} 
    </FunctionCallContainer> 
  );
}

const FunctionResultContainer = styled.div`
  background-color: ${props => props.theme.colors.functionResultBg}; 
  border: 1px solid ${props => props.theme.colors.functionResultBorder};
  border-radius: 8px; 
  padding: 0.75rem 1rem; 
  margin: 0.5rem 0 0.5rem 2.5rem; 
  font-size: 0.9rem; 
  color: ${props => props.theme.colors.functionResultText};
  align-self: flex-start; 
  max-width: 85%; 
  box-shadow: ${props => props.theme.shadows.main};
  
  strong { 
    color: ${props => props.theme.colors.functionResultHeading}; 
    font-weight: 600; 
  }
  
  pre { 
    background-color: ${props => props.theme.colors.functionResultCodeBg}; 
    border: 1px solid ${props => props.theme.colors.functionResultCodeBorder}; 
    padding: 0.5rem; 
    margin-top: 0.5rem; 
    border-radius: 4px; 
    white-space: pre-wrap; 
    word-break: break-all; 
    font-family: 'Courier New', Courier, monospace; 
    font-size: 0.85rem; 
    color: ${props => props.theme.colors.functionResultCodeText}; 
  }
  
  &.error-result { 
    background-color: ${props => props.theme.colors.errorBg}; 
    border-color: ${props => props.theme.colors.errorText}; 
    color: ${props => props.theme.colors.errorText}; 
    
    strong { 
      color: ${props => props.theme.colors.errorText}; 
    } 
    
    pre { 
      color: ${props => props.theme.colors.errorText}; 
    } 
  }
`;

export function FunctionResultDisplay({ functionResultInfo }) {
  if (!functionResultInfo || !functionResultInfo.result) return null;
  
  const isError = functionResultInfo.result.success === false || !!functionResultInfo.result.error;
  const resultData = functionResultInfo.result.error ? { error: functionResultInfo.result.error } : functionResultInfo.result;
  
  // Usar a informação de iteração se disponível
  const iteration = functionResultInfo.iteration || 1;
  const showIterationIndicator = iteration > 1;
  
  return ( 
    <FunctionResultContainer className={isError ? 'error-result' : ''}> 
      <div>
        <strong>{isError ? '⚠️' : '✅'} Resultado ({functionResultInfo.name}):</strong>
        {showIterationIndicator && <SequentialFunctionIndicator>Iteração {iteration}</SequentialFunctionIndicator>}
      </div> 
      <pre>{JSON.stringify(resultData, null, 2)}</pre> 
    </FunctionResultContainer> 
  );
}