import { supabase } from '@/lib/supabaseClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Fetches the structured context for a patient to be provided to the AI during a consultation.
 * This compiles a comprehensive text history from medical history, previous consultation summaries,
 * and medical record notes.
 */
export const getContextForAI = async (patientId: string) => {
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
      .select('record_date, note_content, doctors(name)')
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
        const doctorName = note.doctors?.name || 'Médico não identificado';
        fullPatientHistoryText += `[Anotação em ${noteDate} por Dr. ${doctorName}]:\n${note.note_content}\n\n`;
      });
    }

    if (fullPatientHistoryText.trim() === `Histórico Médico Geral:\n${medicalHistorySummary}\n`) {
      // This means no consultation summaries and no medical notes were found, only the general history
      if (!patientData?.medical_history_summary && (!consultationSummaries || consultationSummaries.length === 0) && (!medicalNotes || medicalNotes.length === 0)) {
        fullPatientHistoryText = "Nenhum histórico contextual disponível para este paciente.";
      }
    }
    
    console.log("[patientContextService] Compiled fullPatientHistoryText for AI:", fullPatientHistoryText.substring(0, 500) + "...");

    return {
      fullPatientHistoryText: fullPatientHistoryText.trim()
    };

  } catch (error: any) {
    console.error('Error fetching comprehensive patient context for AI:', error);
    // Return a simple object indicating no context, so the chat can proceed
    return {
      fullPatientHistoryText: "Erro ao buscar histórico do paciente. Não foi possível carregar o contexto."
    };
  }
};

/**
 * Generates an AI summary for a specific consultation and stores it in the 'consultations' table.
 */
export const generateConsultationSummary = async (consultationId: string, messages: any[]) => {
  if (!consultationId || !messages || messages.length === 0) {
    console.warn('Cannot generate summary: Missing consultationId or messages.');
    return null;
  }
  
  try {
    // Format the conversation for the summary API
    const conversationText = messages
      .map(msg => `${msg.sender === 'ai' ? 'AI' : (msg.sender === 'user' ? 'Doutor(a)' : 'Sistema')}: ${msg.text_content || JSON.stringify(msg.functionCallInfo) || JSON.stringify(msg.functionResultInfo) || 'Mensagem sem conteúdo textual'}`)
      .join('\n');

    // Get auth token for API request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("No authenticated session");
    }
    
    // Call the backend API endpoint to generate summary
    const response = await fetch(`${API_BASE_URL}/summarize-consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ consultation_text: conversationText }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to generate consultation summary: ${response.status} ${errorData}`);
    }
    
    const data = await response.json();
    
    // Store this specific summary in the 'consultations' table
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ ai_summary: data.summary })
      .eq('id', consultationId);

    if (updateError) {
      console.error('Error saving consultation summary to DB:', updateError);
      throw updateError;
    }
    
    console.log('Consultation summary generated and saved:', data.summary);
    return data.summary;
  } catch (error: any) {
    console.error('Error generating or saving consultation summary:', error);
    return null; 
  }
};