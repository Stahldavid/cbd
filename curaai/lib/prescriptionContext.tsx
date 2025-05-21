"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePrescriptionSuggestions, processFillPrescriptionResult, PrescriptionSuggestion } from './prescriptionService';

// Context type
interface PrescriptionContextType {
  suggestions: PrescriptionSuggestion[];
  processPrescriptionFromChat: (functionData: any) => void;
  clearSuggestions: () => void;
}

// Create context
const PrescriptionContext = createContext<PrescriptionContextType | undefined>(undefined);

// Provider component
export function PrescriptionProvider({ children }: { children: React.ReactNode }) {
  // Use the basic hook for suggestions state
  const { suggestions, addSuggestion, clearSuggestions } = usePrescriptionSuggestions();
  
  // Process prescription data from chat
  const processPrescriptionFromChat = (functionData: any) => {
    // Process the function result
    const prescriptionData = processFillPrescriptionResult(functionData);
    
    if (prescriptionData) {
      // Add to suggestions
      addSuggestion(prescriptionData);
      return true;
    }
    
    return false;
  };
  
  const value = {
    suggestions,
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
  
  // Watch messages for prescription function results
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Get the last message
    const lastMessage = messages[messages.length - 1];
    
    // Check if it's a function result for fill_prescription
    if (
      lastMessage?.type === 'functionResult' && 
      lastMessage?.functionResultInfo?.name === 'fill_prescription' && 
      !lastMessage.processed // Add a flag to track processed messages
    ) {
      // Process the prescription
      processPrescriptionFromChat(lastMessage.functionResultInfo);
      
      // Mark as processed (you'd need to store this state somewhere)
      lastMessage.processed = true;
    }
  }, [messages, processPrescriptionFromChat]);
  
  // This component doesn't render anything
  return null;
}
