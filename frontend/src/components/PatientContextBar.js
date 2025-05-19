import React from 'react';
import styled from 'styled-components';
import { ActionButton } from '../ChatSection'; // Assuming ChatSection.js is in parent directory

const BarContainer = styled.div`
  padding: 0.75rem 1.5rem;
  background-color: ${(props) => props.theme.colors.modalBackground}; // Or another suitable color
  color: ${(props) => props.theme.colors.lightText};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  margin-bottom: 1px; // To make it look connected to the toolbar below
`;

const PatientInfo = styled.div`
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  span {
    font-weight: bold;
    color: ${(props) => props.theme.colors.primary};
  }
`;

const PatientActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ContextActionButton = styled(ActionButton)`
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  background-color: ${(props) => props.theme.colors.buttonNeutralBg};
  
  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.colors.secondaryDark};
  }
`;

const NotesToggleButton = styled(ContextActionButton)`
  background-color: ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.buttonNeutralBg };
  color: ${(props) => props.$active ? 'white' : props.theme.colors.text };

  &:hover:not(:disabled) {
    background-color: ${(props) => props.$active ? props.theme.colors.primaryDark : props.theme.colors.secondaryDark};
  }
`;

const EndConsultationButton = styled(ContextActionButton)`
  background-color: ${(props) => props.theme.colors.success || '#22c55e'}; // Green for positive action
  color: white;

 &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.colors.successDark || '#16a34a'};
  }
`;

// Placeholder icons (replace with actual SVG icons if available)
const NotesIcon = () => <span role="img" aria-label="notes">📝</span>;
const CheckCircleIcon = () => <span role="img" aria-label="end-consultation">✔️</span>;
const UserIcon = () => <span role="img" aria-label="select-patient">👤</span>;
const UserPlusIcon = () => <span role="img" aria-label="add-patient">➕👤</span>;
const SwapIcon = () => <span role="img" aria-label="change-patient">🔄</span>;
// CloseIcon was previously used for DeselectPatient, which is now more like ending the session contextually.
// For deselect, we can keep the reddish button, for EndConsultation, we use a green one.

export function PatientContextBar({ 
  activePatient, 
  onSelectPatient, 
  onAddPatient, 
  onChangePatient, 
  onDeselectPatient, // This is now effectively "Encerrar Atendimento" / Clear patient context & start over
  onEndConsultation,   // This is for the formal end of a clinical consultation session, triggering summaries
  onToggleNotes,
  isNotesPanelOpen
}) {
  return (
    <BarContainer>
      {activePatient ? (
        <>
          <PatientInfo>
            Em consulta: <span>{activePatient.name}</span> (RG: {activePatient.rg || 'N/A'})
          </PatientInfo>
          <PatientActions>
            <ContextActionButton onClick={onChangePatient} title="Selecionar outro paciente existente">
              <SwapIcon /> Mudar Paciente
            </ContextActionButton>
            <ContextActionButton onClick={onAddPatient} title="Iniciar consulta com um paciente não cadastrado">
              <UserPlusIcon /> Novo Paciente
            </ContextActionButton>
            <NotesToggleButton 
              onClick={onToggleNotes} 
              $active={isNotesPanelOpen}
              title={isNotesPanelOpen ? "Ocultar Anotações" : "Mostrar Anotações"}
            >
              <NotesIcon /> {isNotesPanelOpen ? "Ocultar Anotações" : "Mostrar Anotações"}
            </NotesToggleButton>
            <EndConsultationButton onClick={onEndConsultation} title="Finalizar e resumir a consulta atual (salva contexto para IA)">
              <CheckCircleIcon /> Finalizar Consulta
            </EndConsultationButton>
            <ContextActionButton 
              onClick={onDeselectPatient} 
              title="Encerrar atendimento (limpa paciente ativo, não salva resumo da sessão atual)" 
              style={{backgroundColor: '#7f1d1d'}} // Keep reddish for this more drastic clear action
            >
              Encerrar Atendimento
            </ContextActionButton>
          </PatientActions>
        </>
      ) : (
        <>
          <PatientInfo>Nenhum paciente selecionado para a consulta.</PatientInfo>
          <PatientActions>
            <ContextActionButton onClick={onSelectPatient} title="Selecionar Paciente Existente">
              <UserIcon /> Selecionar Paciente
            </ContextActionButton>
            <ContextActionButton onClick={onAddPatient} title="Adicionar Novo Paciente">
              <UserPlusIcon /> Adicionar Novo Paciente
            </ContextActionButton>
          </PatientActions>
        </>
      )}
    </BarContainer>
  );
} 