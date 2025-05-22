"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LucideDownload, LucideLoader2 } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Patient as PatientFromContext } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { usePrescription } from "@/lib/prescriptionContext";
import { PrescriptionSuggestion } from "@/lib/prescriptionService";

interface PrescriptionTabProps {
  patient: PatientFromContext;
  doctorId: string | null;
}

interface DoctorDetails {
  id?: string;
  name?: string;
  crm?: string;
  clinic_address?: string;
  email?: string;
  specialty?: string;
  clinic_phone?: string;
  profile_picture_url?: string;
}

interface PrescriptionContent {
  productDetails?: string;
  dosageInstruction?: string;
  justification?: string;
  usageType?: string;
  isContinuousUse?: boolean;
  emissionDate?: string;
}

export function PrescriptionTab({ patient, doctorId }: PrescriptionTabProps) {
  const { user } = useAuth();

  const [patientName, setPatientName] = useState(patient?.name || '');
  const [patientRg, setPatientRg] = useState(patient?.rg || patient?.cpf || '');
  const [patientDob, setPatientDob] = useState(patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : '');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [prescriptionContent, setPrescriptionContent] = useState<PrescriptionContent>({
    productDetails: '',
    dosageInstruction: '',
    justification: '',
    usageType: 'USO ORAL',
    isContinuousUse: false,
    emissionDate: new Date().toLocaleDateString('pt-BR')
  });

  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
  const [isLoadingDoctorDetails, setIsLoadingDoctorDetails] = useState(false);

  // Use prescription context to receive AI-filled data
  const {
    latestAiFilledPrescription,
    registerApplyToFormCallback,
    consumeLatestAiFilledPrescription
  } = usePrescription();

  // Function to apply prescription data from AI
  const applyPrescriptionData = useCallback((data: PrescriptionSuggestion) => {
    console.log("[PrescriptionTab] Received prescription data:", data);
    
    setPrescriptionContent(prev => ({
      ...prev,
      productDetails: data.productDetails || prev.productDetails,
      dosageInstruction: data.dosageInstruction || prev.dosageInstruction,
      justification: data.justification || prev.justification,
      usageType: data.usageType || prev.usageType,
      isContinuousUse: data.isContinuousUse !== undefined ? data.isContinuousUse : prev.isContinuousUse,
      emissionDate: new Date().toLocaleDateString('pt-BR')
    }));
    
    toast.success("Prescription details filled from AI suggestion");
  }, []);

  // Register callback with prescription context
  useEffect(() => {
    registerApplyToFormCallback(applyPrescriptionData);
  }, [registerApplyToFormCallback, applyPrescriptionData]);

  // Handle AI-filled prescription
  useEffect(() => {
    if (latestAiFilledPrescription) {
      applyPrescriptionData(latestAiFilledPrescription);
      consumeLatestAiFilledPrescription();
    }
  }, [latestAiFilledPrescription, applyPrescriptionData, consumeLatestAiFilledPrescription]);

  useEffect(() => {
    if (doctorId) {
      const fetchDoctorDetails = async () => {
        setIsLoadingDoctorDetails(true);
        try {
          const { data, error } = await supabase
            .from('doctors')
            .select('id, name, crm, clinic_address, email, specialty, clinic_phone, profile_picture_url')
            .eq('id', doctorId)
            .single();

          if (error) {
            toast.error(`Failed to fetch doctor details: ${error.message}`);
            console.error("Error fetching doctor details:", error);
            setDoctorDetails(null);
          } else if (data) {
            setDoctorDetails(data);
          } else {
            toast.error("Doctor profile not found.");
            setDoctorDetails(null);
          }
        } catch (err: any) {
          toast.error("An unexpected error occurred while fetching doctor details.");
          console.error("Unexpected error fetching doctor details:", err);
          setDoctorDetails(null);
        } finally {
          setIsLoadingDoctorDetails(false);
        }
      };
      fetchDoctorDetails();
    } else {
      setDoctorDetails(null);
    }
  }, [doctorId]);

  const handleDownloadPdf = async () => {
    if (!doctorDetails) {
      toast.error("Doctor details not loaded. Cannot generate PDF.");
      return;
    }

    toast.info("Generating PDF...", { duration: 2000 });

    try {
      // Create a temporary element for PDF generation
      const tempElement = document.createElement('div');
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px';
      tempElement.style.top = '-9999px';
      tempElement.style.width = '800px';
      tempElement.style.padding = '40px';
      tempElement.style.backgroundColor = 'white';
      tempElement.style.fontFamily = 'Arial, sans-serif';
      
      tempElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
          ${doctorDetails.profile_picture_url ? `<img src="${doctorDetails.profile_picture_url}" alt="Doctor Logo" style="max-height: 70px; max-width: 220px; margin-bottom: 15px;" crossorigin="anonymous" />` : ''}
          <h1 style="font-size: 24px; font-weight: bold; color: #333; margin: 0;">${doctorDetails.name || "Doctor Name N/A"}</h1>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">CRM: ${doctorDetails.crm || "N/A"}${doctorDetails.specialty ? ` | Specialty: ${doctorDetails.specialty}` : ''}</p>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">${doctorDetails.clinic_address || "Clinic Address N/A"}</p>
          <p style="font-size: 14px; color: #666; margin: 5px 0;">Email: ${doctorDetails.email || "N/A"}${doctorDetails.clinic_phone ? ` | Phone: ${doctorDetails.clinic_phone}` : ''}</p>
        </div>
        
        <div style="border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 15px 0; margin: 20px 0;">
          <h3 style="font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 15px; color: #555; text-transform: uppercase; letter-spacing: 1px;">Patient Information</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; color: #555;">
            <div><span style="font-weight: bold;">Name:</span> ${patientName || "N/A"}</div>
            <div><span style="font-weight: bold;">ID/RG/CPF:</span> ${patientRg || "N/A"}</div>
            <div><span style="font-weight: bold;">Date of Birth:</span> ${patientDob || "N/A"}</div>
            <div><span style="font-weight: bold;">Prescription Date:</span> ${prescriptionContent.emissionDate || new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <div style="margin: 30px 0;">
          <h3 style="font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #555; text-transform: uppercase; letter-spacing: 1px;">Prescription</h3>
          
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px;">Product Details:</div>
            <div style="padding: 10px; min-height: 30px; font-size: 12px; border: 1px dashed #ccc; border-radius: 4px; background-color: #f9f9f9; color: #333; white-space: pre-wrap;">
              ${prescriptionContent.productDetails || "N/A"}
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px;">Dosage Instructions:</div>
            <div style="padding: 10px; min-height: 30px; font-size: 12px; border: 1px dashed #ccc; border-radius: 4px; background-color: #f9f9f9; color: #333; white-space: pre-wrap;">
              ${prescriptionContent.dosageInstruction || "N/A"}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px;">Usage Type:</div>
              <div style="font-size: 12px; color: #333;">${prescriptionContent.usageType || "N/A"}</div>
            </div>
            <div>
              <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 5px;">Continuous Use:</div>
              <div style="font-size: 12px; color: #333;">${prescriptionContent.isContinuousUse ? "Yes" : "No"}</div>
            </div>
          </div>
          
          ${prescriptionContent.justification ? '' : ''}
        </div>
        
        <div style="text-align: center; margin-top: 80px;">
          <div style="display: inline-block;">
            <div style="border-top: 2px solid #000; width: 300px; margin: 0 auto 10px; padding-top: 10px; font-size: 12px; color: #555;">
              Doctor's Signature
            </div>
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #333;">${doctorDetails.name || "Doctor Name N/A"}</div>
            <div style="font-size: 12px; color: #666;">CRM: ${doctorDetails.crm || "N/A"}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempElement);
      
      const canvas = await html2canvas(tempElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      
      document.body.removeChild(tempElement);
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgRenderWidth = pdfWidth - 40;
      let imgRenderHeight = imgRenderWidth / canvasAspectRatio;

      if (imgRenderHeight > pdfHeight - 40) {
        imgRenderHeight = pdfHeight - 40;
        imgRenderWidth = imgRenderHeight * canvasAspectRatio;
      }
      
      const xOffset = (pdfWidth - imgRenderWidth) / 2;
      const yOffset = 20;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgRenderWidth, imgRenderHeight);
      pdf.save(`prescription-${patient?.name?.replace(/\s+/g, '_') || 'patient'}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Prescription PDF downloaded successfully!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}. Check console.`);
    }
  };

  useEffect(() => {
    setPatientName(patient?.name || '');
    setPatientRg(patient?.rg || patient?.cpf || '');
    setPatientDob(patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : '');
  }, [patient]);
  
  const handlePrescriptionChange = (field: keyof PrescriptionContent, value: any) => {
    setPrescriptionContent(prev => ({ ...prev, [field]: value }));
  };

  if (isLoadingDoctorDetails) {
    return (
      <div className="flex items-center justify-center h-60">
        <LucideLoader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Loading doctor details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Prescription for: {patientName || "Selected Patient"}</span>
            <Button onClick={handleDownloadPdf} variant="outline" size="sm" className="ml-auto" disabled={!doctorDetails}>
              <LucideDownload className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardTitle>
        </CardHeader>
        
        {/* ONLY Form fields for editing prescription */}
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="productDetails" className="text-sm font-medium">Product Details (AI-filled):</Label>
              <Textarea
                id="productDetails"
                value={prescriptionContent.productDetails || ''}
                onChange={(e) => handlePrescriptionChange('productDetails', e.target.value)}
                placeholder="Product details will be filled by AI..."
                className="min-h-[60px] text-sm"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="dosageInstruction" className="text-sm font-medium">Dosage Instructions:</Label>
              <Textarea
                id="dosageInstruction"
                value={prescriptionContent.dosageInstruction || ''}
                onChange={(e) => handlePrescriptionChange('dosageInstruction', e.target.value)}
                placeholder="e.g., 2 drops, 2 times daily..."
                className="min-h-[80px] text-sm"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageType" className="text-sm font-medium">Usage Type:</Label>
                <Select
                  value={prescriptionContent.usageType}
                  onValueChange={(value) => handlePrescriptionChange('usageType', value)}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select usage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USO ORAL">USO ORAL</SelectItem>
                    <SelectItem value="USO TÓPICO">USO TÓPICO</SelectItem>
                    <SelectItem value="USO SUBLINGUAL">USO SUBLINGUAL</SelectItem>
                    <SelectItem value="USO INALATÓRIO">USO INALATÓRIO</SelectItem>
                    <SelectItem value="OUTRO">OUTRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isContinuousUse"
                  checked={!!prescriptionContent.isContinuousUse}
                  onCheckedChange={(checked) => handlePrescriptionChange('isContinuousUse', !!checked)}
                />
                <Label htmlFor="isContinuousUse" className="text-sm font-medium">
                  Continuous Use
                </Label>
              </div>
            </div>
            
            {prescriptionContent.justification && (
              <div>
                <Label className="text-sm font-medium text-blue-600">Medical Justification (For Doctor Reference Only):</Label>
                <Textarea
                  value={prescriptionContent.justification}
                  onChange={(e) => handlePrescriptionChange('justification', e.target.value)}
                  className="min-h-[80px] text-sm bg-blue-50 border-blue-200"
                  rows={4}
                  placeholder="AI-generated justification for this prescription..."
                />
                <p className="text-xs text-blue-600 mt-1 italic">Note: This justification is for your reference only and will not appear in the downloaded prescription.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}