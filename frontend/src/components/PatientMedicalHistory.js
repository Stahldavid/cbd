import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient'; // For getting auth headers
import { ActionButton } from '../ChatSection'; // Re-use existing button style if appropriate

const HistoryContainer = styled.div\`
  background-color: \${(props) => props.theme.colors.background};
  border: 1px solid \${(props) => props.theme.colors.border};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  max-height: 400px; // Adjust as needed
  display: flex;
  flex-direction: column;
\`;

const NotesList = styled.div\`
  overflow-y: auto;
  flex-grow: 1;
  margin-bottom: 1rem;
\`;

const NoteItem = styled.div\`
  background-color: \${(props) => props.theme.colors.modalBackground};
  border: 1px solid \${(props) => props.theme.colors.border};
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;

  p {
    margin: 0.25rem 0;
  }
  .note-meta {
    font-size: 0.8rem;
    color: \${(props) => props.theme.colors.text};
    opacity: 0.8;
  }
\`;

const NewNoteArea = styled.div\`
  margin-top: 1rem;
  border-top: 1px solid \${(props) => props.theme.colors.border};
  padding-top: 1rem;
\`;

const NoteTextarea = styled.textarea\`
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid \${(props) => props.theme.colors.border};
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  background-color: \${(props) => props.theme.colors.inputBackground};
  color: \${(props) => props.theme.colors.inputText};
\`;

const SaveButton = styled(ActionButton)\`
  margin-top: 0.5rem;
  background-color: \${(props) => props.theme.colors.primary};
  &:hover:not(:disabled) {
    background-color: \${(props) => props.theme.colors.primaryDark};
  }
\`;

const LoadingText = styled.p\`
  text-align: center;
  color: \${(props) => props.theme.colors.text};
\`;

const ErrorText = styled.p\`
  text-align: center;
  color: red;
\`;


export function PatientMedicalHistory({ activePatient, doctorId }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.warn("No Supabase session for backend request.");
        return { 'Content-Type': 'application/json' };
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${session.access_token}\`
    };
  };

  const fetchNotes = useCallback(async () => {
    if (!activePatient?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(\`\${API_BASE_URL}/patients/\${activePatient.id}/medical-records\`, { headers });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(\`Failed to fetch notes: \${response.status} \${errorData}\`);
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activePatient?.id, API_BASE_URL]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!activePatient?.id || !newNote.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(\`\${API_BASE_URL}/patients/\${activePatient.id}/medical-records\`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ note_content: newNote }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(\`Failed to save note: \${response.status} \${errorData}\`);
      }
      setNewNote(''); // Clear textarea
      fetchNotes(); // Refresh notes list
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!activePatient) {
    return null; // Or a placeholder message
  }

  return (
    <HistoryContainer>
      <h3>Histórico Médico de: {activePatient.name}</h3>
      {isLoading && !notes.length && <LoadingText>Carregando histórico...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}
      
      <NotesList>
        {!isLoading && !error && notes.length === 0 && <p>Nenhuma anotação encontrada para este paciente.</p>}
        {notes.map(note => (
          <NoteItem key={note.id}>
            <p className="note-meta">
              <strong>Dr(a). {note.doctor_name || 'Desconhecido'}</strong> em {new Date(note.record_date).toLocaleString('pt-BR')}
            </p>
            <p>{note.note_content}</p>
          </NoteItem>
        ))}
      </NotesList>

      <NewNoteArea>
        <h4>Adicionar Nova Anotação à Consulta Atual</h4>
        <NoteTextarea 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Digite suas anotações sobre a consulta aqui..."
          disabled={isLoading}
        />
        <SaveButton onClick={handleSaveNote} disabled={isLoading || !newNote.trim()}>
          {isLoading ? 'Salvando...' : 'Salvar Anotação'}
        </SaveButton>
      </NewNoteArea>
    </HistoryContainer>
  );
} 