"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

// Types for AI-generated prescriptions
export interface PrescriptionSuggestion {
  id: string;
  productDetails: string;
  dosageInstruction: string;
  justification: string;
  usageType: string;
  isContinuousUse: boolean;
  timestamp: Date;
}

/**
 * Hook to track and apply AI-generated prescription suggestions
 */
export function usePrescriptionSuggestions() {
  const [suggestions, setSuggestions] = useState<PrescriptionSuggestion[]>([]);
  
  // Function to add a new prescription suggestion (from AI)
  const addSuggestion = (data: Omit<PrescriptionSuggestion, 'id' | 'timestamp'>) => {
    const newSuggestion: PrescriptionSuggestion = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setSuggestions(prev => [newSuggestion, ...prev]);
    toast.success("Nova prescrição sugerida pelo assistente");
    return newSuggestion;
  };
  
  // Clear all suggestions
  const clearSuggestions = () => {
    setSuggestions([]);
  };
  
  return {
    suggestions,
    addSuggestion,
    clearSuggestions
  };
}

/**
 * Process fill_prescription tool responses from the AI
 */
export function processFillPrescriptionResult(functionData: any): Omit<PrescriptionSuggestion, 'id' | 'timestamp'> | null {
  if (!functionData || !functionData.result || !functionData.result.filledData) {
    console.error("Invalid fill_prescription result format", functionData);
    return null;
  }
  
  const { productDetails, dosageInstruction, justification, usageType, isContinuousUse } = functionData.result.filledData;
  
  // Validate required fields
  if (!productDetails || !dosageInstruction) {
    console.error("Missing required prescription fields", functionData.result.filledData);
    return null;
  }
  
  return {
    productDetails, 
    dosageInstruction, 
    justification: justification || "",
    usageType: usageType || "USO ORAL",
    isContinuousUse: !!isContinuousUse
  };
}
