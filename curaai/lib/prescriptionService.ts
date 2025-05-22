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
  console.log("[processFillPrescriptionResult] Raw functionData:", functionData);
  
  // Try different possible data structures
  let data = null;
  
  // Check for result.filledData structure
  if (functionData?.result?.filledData) {
    data = functionData.result.filledData;
  }
  // Check for direct result structure
  else if (functionData?.result && typeof functionData.result === 'object') {
    data = functionData.result;
  }
  // Check if functionData itself contains the prescription data
  else if (functionData?.productDetails || functionData?.productInfo) {
    data = functionData;
  }
  
  if (!data) {
    console.error("[processFillPrescriptionResult] Could not find prescription data in:", functionData);
    return null;
  }
  
  console.log("[processFillPrescriptionResult] Found data:", data);
  
  // Handle both productDetails and productInfo field names
  const productDetails = data.productDetails || data.productInfo;
  const { dosageInstruction, justification, usageType, isContinuousUse } = data;
  
  // Validate required fields
  if (!productDetails || !dosageInstruction) {
    console.error("[processFillPrescriptionResult] Missing required fields. productDetails:", productDetails, "dosageInstruction:", dosageInstruction);
    return null;
  }
  
  const result = {
    productDetails, 
    dosageInstruction, 
    justification: justification || "",
    usageType: usageType || "USO ORAL",
    isContinuousUse: !!isContinuousUse
  };
  
  console.log("[processFillPrescriptionResult] Returning processed data:", result);
  
  return result;
}
