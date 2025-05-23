"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrescriptionSuggestions, processFillPrescriptionResult, PrescriptionSuggestion } from './prescriptionService';
import { toast } from 'sonner';
import { useTabStore } from './tabStore'; // Import your tab store

// Context type
interface PrescriptionContextType {
  suggestions: PrescriptionSuggestion[];
  /**
   * The latest prescription data received from the AI, intended for auto-filling.
   * It's set to null after being "consumed" by the form.
   */
  latestAiFilledPrescription: PrescriptionSuggestion | null;
  /**
   * A callback function that the PrescriptionForm will provide to update itself.
   * This allows the context to trigger a form fill.
   */
  registerApplyToFormCallback: (callback: (data: PrescriptionSuggestion) => void) => void;
  /**
   * Call this function after the form has applied the latestAiFilledPrescription.
   */
  consumeLatestAiFilledPrescription: () => void;
  processPrescriptionFromChat: (functionData: any) => boolean;
  clearSuggestions: () => void;
}

// Create context
const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

// Provider component
export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  // Use the basic hook for suggestions state
  const { suggestions, addSuggestion, clearSuggestions } = usePrescriptionSuggestions();
  const [latestAiFilledPrescription, setLatestAiFilledPrescription] = useState<PrescriptionSuggestion | null>(null);
  const [applyToFormCallback, setApplyToFormCallback] = useState<((data: PrescriptionSuggestion) => void) | null>(null);
  const { setActiveTab } = useTabStore(); // Get setActiveTab from the tab store
  
  const registerApplyToFormCallback = useCallback((callback: (data: PrescriptionSuggestion) => void) => {
    setApplyToFormCallback(() => callback);
  }, []);

  const consumeLatestAiFilledPrescription = useCallback(() => {
    setLatestAiFilledPrescription(null);
  }, []);

  // Process prescription data from chat
  const processPrescriptionFromChat = useCallback((functionData: any): boolean => {
    console.log("[PrescriptionContext] Processing prescription data:", functionData);
    
    // Process the function result
    const prescriptionData = processFillPrescriptionResult(functionData);
    
    if (prescriptionData) {
      // Add to suggestions
      const suggestion = addSuggestion(prescriptionData);
      console.log("[PrescriptionContext] Added prescription suggestion:", suggestion);
      
      setLatestAiFilledPrescription(suggestion); // Set for auto-filling

      // If a form callback is registered, call it immediately
      if (applyToFormCallback && suggestion) {
        applyToFormCallback(suggestion);
      }

      // Programmatically switch to the prescription tab
      // Ensure 'prescription' is the correct key for your prescription tab
      setActiveTab('prescriptions'); // use 'prescriptions' as per patient-details.tsx
      
      toast.success("Nova prescrição recebida e preenchida automaticamente!", {
        duration: 6000,
        description: "A aba de prescrição foi aberta.",
        action: {
          label: "Ver", // Simple action label
          onClick: () => setActiveTab('prescriptions'), // use 'prescriptions'
        }
      });
      
      return true;
    }
    
    return false;
  }, [addSuggestion, setActiveTab, applyToFormCallback]); // Added applyToFormCallback to dependencies
  
  const value = {
    suggestions,
    latestAiFilledPrescription,
    registerApplyToFormCallback,
    consumeLatestAiFilledPrescription,
    processPrescriptionFromChat,
    clearSuggestions
  };
  
  return (
    <PrescriptionContext.Provider value={value}>
      {children}
    </PrescriptionContext.Provider>
  );
}

// Hook to use the context
export function usePrescription() {
  const context = useContext(PrescriptionContext);
  
  if (context === undefined) {
    throw new Error('usePrescription must be used within a PrescriptionProvider');
  }
  
  return context;
}

/**
 * Component that can be included in the chat to process prescription function calls
 * This component doesn't render anything but watches chat messages for prescription data
 */
export function PrescriptionProcessor({ messages }: { messages: any[] }) {
  const { processPrescriptionFromChat } = usePrescription();
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set());
  const setActiveTab = useTabStore(state => state.setActiveTab);
  
  // Watch messages for prescription function results
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Check all messages for fill_prescription function results
    messages.forEach((message) => {
      // Skip if we've already processed this message
      if (!message?.id || processedMessageIds.has(message.id)) return;
      
      console.log("[PrescriptionProcessor] Checking message:", message.id, message.type, message.functionResultInfo?.name);
      
      // Check if it's a function result for fill_prescription
      if (
        message?.type === 'functionResult' && 
        message?.functionResultInfo?.name === 'fill_prescription'
      ) {
        console.log("[PrescriptionProcessor] Found fill_prescription result:", message.functionResultInfo);
        
        // Process the prescription
        const success = processPrescriptionFromChat(message.functionResultInfo);
        
        if (success) {
          console.log("[PrescriptionProcessor] Successfully processed prescription");
        } else {
          console.error("[PrescriptionProcessor] Failed to process prescription");
        }
        
        // Mark as processed by adding to our Set
        setProcessedMessageIds(prev => new Set(prev).add(message.id!));
      }
    });
  }, [messages, processPrescriptionFromChat, processedMessageIds, setActiveTab]);
  
  // This component doesn't render anything
  return null;
}
