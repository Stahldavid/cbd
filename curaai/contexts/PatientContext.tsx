"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Define a basic Patient type. Expand as needed from your DB schema.
export interface Patient {
  id: string;
  name?: string;
  date_of_birth?: string;
  gender?: string;
  cpf?: string;
  rg?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  medical_history_summary?: string;
  avatar_url?: string;
  age?: number | string;
  primary_condition?: string;
  // Add other relevant patient fields that you need in the context or for display
  // e.g., email, phone, medical_history_summary, etc.
}

// Updated Props to include consultation management
interface PatientContextProps {
  patients: Patient[];
  activePatient: Patient | null;
  isLoadingPatients: boolean;
  fetchPatients: () => Promise<void>;
  selectPatient: (patient: Patient | null) => void;
  addPatient: (patientData: Omit<Patient, 'id' | 'age'>) => Promise<Patient | null>;
  currentConsultationId: string | null;
  startNewConsultation: (patientId: string, doctorId: string) => Promise<string | null>;
  endCurrentConsultation: () => Promise<void>;
  clearActivePatientAndConsultation: () => void;
}

const PatientContext = createContext<PatientContextProps | undefined>(undefined);

interface PatientProviderProps {
  children: ReactNode;
}

export const PatientProvider = ({ children }: PatientProviderProps) => {
  const { user, doctorId: currentDoctorId, loading: authLoading } = useAuth(); // To fetch patients for the logged-in doctor
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [currentConsultationId, setCurrentConsultationId] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!user || authLoading) {
      // Don't fetch if no user or auth is still loading
      // It might be good to clear patients if user becomes null
      if(!user) setPatients([]);
      return;
    }
    
    setIsLoadingPatients(true);
    try {
      // Assuming you have a 'patients' table and want to fetch patients 
      // related to the current doctor (user.id) or all patients if it's a general view.
      // Modify this query according to your database schema and requirements.
      // For example, if patients are linked to doctors via a 'doctor_id' column:
      // const { data, error } = await supabase
      //   .from('patients')
      //   .select('*') // Select specific columns for performance: 'id, name, date_of_birth'
      //   .eq('assigned_doctor_id', user.id); // Or however you link patients to doctors

      // For now, let's assume a generic patients table without explicit doctor linkage for demo purposes
      // Or that RLS policies on Supabase handle this.
      const { data, error } = await supabase
        .from('patients') // Replace 'patients' with your actual table name
        .select('id, name, date_of_birth, gender, cpf, rg, phone_number, email, address, medical_history_summary'); // Adjust columns as needed
        // .order('name', { ascending: true }); // Optional: order patients

      if (error) {
        throw error;
      }
      setPatients(data || []);
      // Optionally, set the first patient as active if none is selected
      // if (data && data.length > 0 && !activePatient) {
      //   setActivePatient(data[0]);
      // }
    } catch (error: any) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients: " + error.message);
      setPatients([]); // Clear patients on error
    } finally {
      setIsLoadingPatients(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Fetch patients when the component mounts or when the user changes
    // and auth is no longer loading.
    if (user && !authLoading) {
        fetchPatients();
    } else if (!user && !authLoading) {
        // Clear patient data if user logs out
        setPatients([]);
        setActivePatient(null);
        setCurrentConsultationId(null);
    }
  }, [user, authLoading, fetchPatients]);

  // Function to start a new consultation
  const startNewConsultation = useCallback(async (patientId: string, doctorId: string): Promise<string | null> => {
    if (!patientId || !doctorId) {
      toast.error("Patient ID or Doctor ID is missing to start consultation.");
      return null;
    }
    try {
      // Check for an existing active (non-ended) consultation for this patient & doctor first?
      // For simplicity, we'll assume starting a new one is always intended for now if this function is called.
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          // start_time is default now()
        })
        .select('id')
        .single(); 

      if (error) {
        toast.error(`Failed to start new consultation: ${error.message}`);
        throw error;
      }
      if (data?.id) {
        setCurrentConsultationId(data.id);
        toast.success("New consultation started in context.");
        return data.id;
      }
      return null;
    } catch (error: any) {
      console.error("Error starting new consultation:", error);
      return null;
    }
  }, []);

  // Function to end the current consultation
  const endCurrentConsultation = useCallback(async () => {
    if (!currentConsultationId) return;

    const consultationIdToEnd = currentConsultationId; // Store it before it's cleared

    try {
      // Step 1: Mark consultation end_time in Supabase
      const { error: updateError } = await supabase
        .from('consultations')
        .update({ end_time: new Date().toISOString() })
        .eq('id', consultationIdToEnd);

      if (updateError) {
        toast.error(`Failed to update consultation end time: ${updateError.message}`);
        // Do not throw here, try to proceed with summary if desired or allow manual retry
        // Depending on desired behavior, you might still want to clear currentConsultationId or not
      } else {
        toast.success("Consultation end time marked.");
      }

      // Step 2: Attempt to generate AI summary (after end_time is set)
      // Use NEXT_PUBLIC_API_URL which should be defined in your .env files
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"; 
      const summaryUrl = `${API_BASE_URL}/consultations/${consultationIdToEnd}/generate-summary`;
      
      toast.info("Generating consultation summary...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Authentication session not found. Cannot generate summary.");
        }

        const response = await fetch(summaryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Unknown error during summary generation." }));
          throw new Error(errorData.message || `Failed to generate summary (status ${response.status})`);
        }
        
        const summaryResult = await response.json();
        toast.success(summaryResult.message || "Consultation summary generated successfully.");
        // Optionally, do something with summaryResult.summary if needed in frontend

      } catch (summaryError: any) {
        console.error("Error generating consultation summary:", summaryError);
        toast.error(`Summary generation failed: ${summaryError.message}`);
        // This error does not prevent the consultation from being considered "ended" locally
      }

      // Step 3: Clear the current consultation ID from context state
      // This signifies the consultation is fully "done" from the app's perspective.
      setCurrentConsultationId(null); 
      // The original toast.info("Consultation ended.") might be redundant now with more specific toasts.
      // Or, it can be a final confirmation.
      toast.info("Consultation process completed.");


    } catch (error: any) { // Catch errors from Step 1 (marking end_time) if they were re-thrown
      console.error("Error ending consultation:", error);
      // If marking end_time failed catastrophically, currentConsultationId might still be set,
      // allowing the user to retry ending it. Or, clear it to prevent repeated issues.
      // For now, let's assume if Step 1 fails hard, we don't clear it, prompting a potential retry.
      // However, the current flow only toasts the error from Step 1 and proceeds.
    }
  }, [currentConsultationId]);

  // Function to clear both active patient and consultation
  const clearActivePatientAndConsultation = useCallback(async () => {
    if (currentConsultationId) {
        await endCurrentConsultation(); // Attempt to end it gracefully
    }
    setActivePatient(null);
    setCurrentConsultationId(null); // Ensure it's cleared
    toast.info("Active patient and consultation cleared.");
  }, [currentConsultationId, endCurrentConsultation]);

  const addPatient = useCallback(async (patientData: Omit<Patient, 'id' | 'age'>): Promise<Patient | null> => {
    if (!user) {
      toast.error("You must be logged in to add a patient.");
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([
          {
            ...patientData,
            // Assuming 'created_by_doctor_id' or similar field exists to link patient to doctor
            // If not, you might not need this or adjust your RLS policies
            // created_by_doctor_id: user.id, 
          }
        ])
        .select()
        .single();

      if (error) {
        toast.error(`Failed to add patient: ${error.message}`);
        throw error;
      }

      if (data) {
        toast.success(`Patient ${data.name} added successfully.`);
        await fetchPatients(); // Refresh the patient list
        return data as Patient;
      }
      return null;
    } catch (error: any) {
      console.error("Error adding patient:", error);
      return null;
    }
  }, [user, fetchPatients]);

  const selectPatient = useCallback(async (patient: Patient | null) => {
    if (activePatient?.id === patient?.id) return; // No change if same patient

    if (currentConsultationId && activePatient) {
      // Check if the doctor has actively participated in the current consultation
      let doctorParticipated = false;
      try {
        const { count, error } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('consultation_id', currentConsultationId)
          .eq('sender', 'user'); // 'user' sender indicates a message from the doctor

        if (error) {
          console.error("Error checking for doctor's participation:", error);
          toast.error("Falha ao verificar participação do médico. Procedendo com cautela.");
          doctorParticipated = true; // Default to true (prompt) to be safe if DB check fails
        } else {
          doctorParticipated = (count || 0) > 0;
        }
      } catch (e) {
        console.error("Exception checking for doctor's participation:", e);
        toast.error("Exceção ao verificar participação. Procedendo com cautela.");
        doctorParticipated = true; // Default to true (prompt) on exception
      }

      if (doctorParticipated) {
        const confirmChange = window.confirm(
          "Deseja realmente mudar de paciente? A consulta atual será finalizada e qualquer resumo não salvo para uso futuro poderá ser perdido."
        );
        if (confirmChange) {
          await endCurrentConsultation(); 
          setCurrentConsultationId(null); 
        } else {
          return; // User cancelled the change
        }
      } else {
        // Doctor did not participate, end consultation silently
        await endCurrentConsultation();
        setCurrentConsultationId(null);
      }
    } else if (currentConsultationId) {
      // This case handles deselecting the current patient or an inconsistent state
      // (consultation active but no activePatient in context)
      await endCurrentConsultation();
      setCurrentConsultationId(null);
    }
    
    setActivePatient(patient);

    if (patient) {
        toast.success(`${patient.name} selected.`);
    } else {
        if(currentConsultationId) { // Should have been cleared above if a consultation existed
            setCurrentConsultationId(null); 
        }
        toast.info("No patient selected.");
    }
  }, [activePatient, currentConsultationId, endCurrentConsultation, clearActivePatientAndConsultation]);

  const value = {
    patients,
    activePatient,
    isLoadingPatients,
    fetchPatients,
    selectPatient,
    addPatient,
    currentConsultationId,
    startNewConsultation,
    endCurrentConsultation,
    clearActivePatientAndConsultation
  };

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}; 