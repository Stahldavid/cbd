import { supabase } from './supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn("No Supabase session for backend request.");
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
};

/**
 * Generates an AI summary for a specific consultation and stores it in the 'consultations' table.
 * This summary is for that single session, not the overall patient context.
 */
export const generateConsultationSpecificSummary = async (consultationId, messages) => {
  if (!consultationId || !messages || messages.length === 0) {
    console.warn('Cannot generate consultation-specific summary: Missing consultationId or messages.');
    return null;
  }
  try {
    const conversationText = messages
      .map(msg => `${msg.sender === 'ai' ? 'AI' : (msg.sender === 'user' ? 'Doutor(a)' : 'Sistema')}: ${msg.text_content || JSON.stringify(msg.function_call_info) || JSON.stringify(msg.function_result_info) || 'Mensagem sem conteúdo textual'}`)
      .join('\n');

    const headers = await getAuthHeaders();
    // This backend endpoint needs to be created. 
    // It should take the conversation and return a summary for *this specific consultation*.
    const response = await fetch(`${API_BASE_URL}/summarize-consultation`, { // New endpoint
      method: 'POST',
      headers,
      body: JSON.stringify({ consultation_text: conversationText }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to generate consultation-specific summary: ${response.status} ${errorData}`);
    }
    const data = await response.json();
    
    // Store this specific summary in the 'consultations' table
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ ai_summary: data.summary })
      .eq('id', consultationId);

    if (updateError) {
      console.error('Error saving consultation-specific summary to DB:', updateError);
      throw updateError;
    }
    console.log('Consultation-specific summary generated and saved:', data.summary);
    return data.summary;
  } catch (error) {
    console.error('Error generating or saving consultation-specific summary:', error);
    // Do not throw here to allow the rest of the end-consultation flow to proceed
    return null; 
  }
};


/**
 * Updates the overall AI context summary for a patient in the 'patients' table.
 * This involves sending the latest consultation messages and existing contexts to the backend.
 */
export const updatePatientOverallContext = async (patientId, messages) => {
  if (!patientId || !messages || messages.length === 0) {
    console.warn('Cannot update patient overall context: Missing patientId or messages.');
    return null;
  }
  try {
    const conversationText = messages
      .map(msg => `${msg.sender === 'ai' ? 'AI' : (msg.sender === 'user' ? 'Doutor(a)' : 'Sistema')}: ${msg.text_content || JSON.stringify(msg.function_call_info) || JSON.stringify(msg.function_result_info) || 'Mensagem sem conteúdo textual'}`)
      .join('\n');

    // Fetch current medical_history_summary and ai_context_summary from patients table
    const { data: patientData, error: patientFetchError } = await supabase
      .from('patients')
      .select('medical_history_summary, ai_context_summary')
      .eq('id', patientId)
      .single();

    if (patientFetchError) {
      console.error('Error fetching current patient context:', patientFetchError);
      throw patientFetchError;
    }

    const headers = await getAuthHeaders();
    // This is the backend endpoint from Proposal C for generating the *overall patient context*
    const response = await fetch(`${API_BASE_URL}/generate-patient-context`, { 
      method: 'POST',
      headers,
      body: JSON.stringify({
        patientId,
        conversation_text: conversationText,
        current_medical_history: patientData?.medical_history_summary || '',
        current_ai_context: patientData?.ai_context_summary || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to generate patient overall context: ${response.status} ${errorData}`);
    }
    const data = await response.json(); // Expects { contextSummary: "..." }

    // Update the ai_context_summary field in the patients table
    const { error: updateError } = await supabase
      .from('patients')
      .update({ ai_context_summary: data.contextSummary })
      .eq('id', patientId);

    if (updateError) {
      console.error('Error saving patient overall context to DB:', updateError);
      throw updateError;
    }
    console.log('Patient overall context updated and saved.');
    return data.contextSummary;
  } catch (error) {
    console.error('Error updating patient overall context:', error);
    throw error; // Re-throw to be caught by the calling function
  }
};

/**
 * Fetches the structured context for a patient to be provided to the AI during a consultation.
 * This version compiles a comprehensive text history from medical history, all consultation summaries,
 * and all medical record notes.
 */
export const getContextForAI = async (patientId) => {
  if (!patientId) return null;
  try {
    // 1. Fetch general medical history summary from patients table
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('medical_history_summary')
      .eq('id', patientId)
      .single();

    if (patientError) throw patientError;

    const medicalHistorySummary = patientData?.medical_history_summary || "Nenhum histórico médico geral fornecido.";

    // 2. Fetch all AI-generated consultation summaries for the patient, ordered by time
    const { data: consultationSummaries, error: summariesError } = await supabase
      .from('consultations')
      .select('start_time, ai_summary')
      .eq('patient_id', patientId)
      .not('ai_summary', 'is', null) // Only get consultations that have a summary
      .order('start_time', { ascending: true });

    if (summariesError) throw summariesError;

    // 3. Fetch all medical record notes for the patient, ordered by time
    const { data: medicalNotes, error: notesError } = await supabase
      .from('medical_records')
      .select('record_date, note_content')
      .eq('patient_id', patientId)
      .order('record_date', { ascending: true });

    if (notesError) throw notesError;

    // 4. Compile into a single text string
    let fullPatientHistoryText = `Histórico Médico Geral:
${medicalHistorySummary}

`;

    if (consultationSummaries && consultationSummaries.length > 0) {
      fullPatientHistoryText += "--- Resumos de Consultas Anteriores ---\n";
      consultationSummaries.forEach(summary => {
        const consultDate = summary.start_time ? new Date(summary.start_time).toLocaleDateString('pt-BR') : 'Data desconhecida';
        fullPatientHistoryText += `[Consulta em ${consultDate}]:\n${summary.ai_summary || "Sem resumo registrado."}\n\n`;
      });
    }

    if (medicalNotes && medicalNotes.length > 0) {
      fullPatientHistoryText += "--- Anotações Médicas Adicionais ---\n";
      medicalNotes.forEach(note => {
        const noteDate = note.record_date ? new Date(note.record_date).toLocaleDateString('pt-BR') : 'Data desconhecida';
        fullPatientHistoryText += `[Anotação em ${noteDate}]:\n${note.note_content}\n\n`;
      });
    }

    if (fullPatientHistoryText.trim() === `Histórico Médico Geral:\n${medicalHistorySummary}\n`) {
        // This means no consultation summaries and no medical notes were found, only the general history (or empty general history)
        if (!patientData?.medical_history_summary && (!consultationSummaries || consultationSummaries.length === 0) && (!medicalNotes || medicalNotes.length === 0)) {
            fullPatientHistoryText = "Nenhum histórico contextual disponível para este paciente.";
        } // else, it just contains the medical_history_summary which is fine.
    }
    
    console.log("[DEBUG patientContextService] Compiled fullPatientHistoryText for AI:", fullPatientHistoryText.substring(0, 500) + "...");

    return {
      fullPatientHistoryText: fullPatientHistoryText.trim()
    };

  } catch (error) {
    console.error('Error fetching comprehensive patient context for AI:', error);
    // Return a simple object indicating no context, rather than throwing, 
    // so the chat can proceed with a "no context" note to the AI.
    return {
      fullPatientHistoryText: "Erro ao buscar histórico do paciente. Não foi possível carregar o contexto."
    };
  }
}; 