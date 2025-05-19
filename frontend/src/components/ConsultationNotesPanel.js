import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient';
import { ActionButton } from '../ChatSection'; // Assuming this is a suitable button

// Styled Components (can be moved to a separate file or kept here)
const NotesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.backgroundSlightlyDarker || props.theme.colors.background};
`;

const NotesTabsContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  cursor: pointer;
  border: none;
  background-color: transparent;
  border-bottom: 2px solid ${(props) => (props.$active ? props.theme.colors.primary : 'transparent')};
  color: ${(props) => (props.$active ? props.theme.colors.primary : props.theme.colors.text)};
  font-weight: ${(props) => (props.$active ? 'bold' : 'normal')};
  
  &:hover {
    color: ${(props) => props.theme.colors.primary};
  }
`;

const EditorSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  flex-shrink: 0; // Prevents editor from shrinking too much if previous notes are many
`;

const NoteTextArea = styled.textarea`
  width: 100%;
  min-height: 150px; // Start with a decent height
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.9rem;
  background-color: ${(props) => props.theme.colors.inputBackground};
  color: ${(props) => props.theme.colors.inputText};
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${(props) => props.theme.colors.primary + '40'}; // Semi-transparent primary
  }
`;

const SaveNoteButton = styled(ActionButton)`
  align-self: flex-end;
  margin-top: 0.5rem;
  background-color: ${(props) => props.theme.colors.primary};

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.colors.primaryDark};
  }
`;

const PreviousNotesSection = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-grow: 1;
`;

const NoteCardItem = styled.div`
  background-color: ${(props) => props.theme.colors.modalBackground};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const NoteHeaderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: ${(props) => props.theme.colors.textLight || '#888'};
`;

const NoteDateText = styled.div`
  font-weight: bold;
`;

const NoteDoctorName = styled.div`
  // You might need to fetch doctor's name if doctor_id is just a UUID
`;

const NoteContentText = styled.div`
  white-space: pre-wrap;
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.text};
`;

const LoadingIndicatorText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: ${(props) => props.theme.colors.textLight || '#888'};
  font-style: italic;
`;

const EmptyStateText = styled(LoadingIndicatorText)``;

export function ConsultationNotesPanel({ activePatient, doctorId }) {
  const [currentTab, setCurrentTab] = useState('new'); // 'new' or 'previous'
  const [currentNote, setCurrentNote] = useState('');
  const [previousNotes, setPreviousNotes] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);
  // Store doctor names if you fetch them
  // const [doctorNames, setDoctorNames] = useState({}); 

  const fetchPreviousNotes = useCallback(async () => {
    if (!activePatient?.id) return;
    setIsLoadingPrevious(true);
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          id,
          record_date,
          note_content,
          doctor_id,
          doctors ( name ) 
        `)
        .eq('patient_id', activePatient.id)
        .order('record_date', { ascending: false });

      if (error) throw error;
      setPreviousNotes(data || []);
      // Optional: Populate doctorNames map if you need it elsewhere
      // const names = {};
      // data.forEach(note => {
      //   if (note.doctors && note.doctor_id) {
      //     names[note.doctor_id] = note.doctors.name;
      //   }
      // });
      // setDoctorNames(names);

    } catch (error) {
      console.error('Error fetching previous notes:', error);
      // Consider setting an error state to display to the user
    } finally {
      setIsLoadingPrevious(false);
    }
  }, [activePatient?.id]);

  useEffect(() => {
    if (activePatient?.id) {
      fetchPreviousNotes();
    } else {
      setPreviousNotes([]); // Clear notes if no active patient
      setCurrentNote(''); // Clear current note input
    }
  }, [activePatient, fetchPreviousNotes]);

  const handleSaveNote = async () => {
    if (!currentNote.trim() || !activePatient?.id || !doctorId) {
      // Optionally, show a toast or message if fields are missing
      console.warn('Cannot save note: Missing content, patient, or doctor ID.');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          patient_id: activePatient.id,
          doctor_id: doctorId, // Ensure doctorId is passed as a prop and is available
          note_content: currentNote,
          // record_date will default to now() in the database
        })
        .select(`
          id,
          record_date,
          note_content,
          doctor_id,
          doctors ( name )
        `)
        .single();

      if (error) throw error;

      if (data) {
        setPreviousNotes((prev) => [data, ...prev]); // Add new note to the top
      }
      setCurrentNote(''); // Clear the textarea
      // Optionally, show a success toast
      console.log('Note saved successfully');
      setCurrentTab('previous'); // Switch to previous notes tab after saving
    } catch (error) {
      console.error('Error saving note:', error);
      // Optionally, show an error toast
    } finally {
      setIsSaving(false);
    }
  };
  
  // It might be better to clear the currentNote when the patient changes.
  useEffect(() => {
      setCurrentNote('');
  }, [activePatient?.id]);


  return (
    <NotesWrapper>
      <NotesTabsContainer>
        <TabButton $active={currentTab === 'new'} onClick={() => setCurrentTab('new')}>
          Nova Anotação
        </TabButton>
        <TabButton $active={currentTab === 'previous'} onClick={() => setCurrentTab('previous')}>
          Anotações Anteriores ({previousNotes.length})
        </TabButton>
      </NotesTabsContainer>

      {currentTab === 'new' && (
        <EditorSection>
          <NoteTextArea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Digite suas anotações da consulta aqui..."
            disabled={isSaving || !activePatient}
          />
          <SaveNoteButton onClick={handleSaveNote} disabled={isSaving || !currentNote.trim() || !activePatient}>
            {isSaving ? 'Salvando...' : 'Salvar Anotação'}
          </SaveNoteButton>
        </EditorSection>
      )}

      {currentTab === 'previous' && (
        <PreviousNotesSection>
          {isLoadingPrevious ? (
            <LoadingIndicatorText>Carregando anotações...</LoadingIndicatorText>
          ) : previousNotes.length > 0 ? (
            previousNotes.map((note) => (
              <NoteCardItem key={note.id}>
                <NoteHeaderInfo>
                  <NoteDateText>
                    {new Date(note.record_date).toLocaleString('pt-BR', { 
                      day: '2-digit', month: '2-digit', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </NoteDateText>
                  {/* Display doctor's name. Assumes 'doctors' table has a 'name' column and RLS allows access. */}
                  <NoteDoctorName>Dr(a). {note.doctors?.name || 'Desconhecido'}</NoteDoctorName>
                </NoteHeaderInfo>
                <NoteContentText>{note.note_content}</NoteContentText>
              </NoteCardItem>
            ))
          ) : (
            <EmptyStateText>Nenhuma anotação anterior para este paciente.</EmptyStateText>
          )}
        </PreviousNotesSection>
      )}
    </NotesWrapper>
  );
} 