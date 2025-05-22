"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LucideDownload, LucideClipboardEdit, LucideLoader2, LucideSparkles } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Patient as PatientFromContext } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

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
  profile_picture_url?: string; // Added field for the logo URL
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
  const prescriptionContentRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (doctorId) {
      const fetchDoctorDetails = async () => {
        setIsLoadingDoctorDetails(true);
        try {
          const { data, error } = await supabase
            .from('doctors')
            .select('id, name, crm, clinic_address, email, specialty, clinic_phone, profile_picture_url') // Added profile_picture_url
            .eq('id', doctorId)
            .single();

          if (error) {
            toast.error(`Failed to fetch doctor details: ${error.message}`);
            console.error("Error fetching doctor details:", error);
            setDoctorDetails(null);
          } else if (data) {
            setDoctorDetails(data);
          } else {
            toast.warn("Doctor profile not found.");
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
    const prescriptionElement = prescriptionContentRef.current;
    if (!prescriptionElement) {
      toast.error("Prescription content element not found.");
      return;
    }
    if (!doctorDetails) {
      toast.error("Doctor details not loaded. Cannot generate PDF.");
      return;
    }

    toast.info("Preparing PDF, please wait...", { duration: 2000 });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to allow images to load

    try {
      const canvas = await html2canvas(prescriptionElement, {
        scale: 2.5, 
        useCORS: true, 
        logging: true,
        backgroundColor: '#ffffff',
        scrollX: 0, 
        scrollY: 0, 
        windowWidth: prescriptionElement.offsetWidth, 
        windowHeight: prescriptionElement.offsetHeight, 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit A4 page while maintaining aspect ratio
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgRenderWidth = pdfWidth - 40; // 20pt margin on each side
      let imgRenderHeight = imgRenderWidth / canvasAspectRatio;

      if (imgRenderHeight > pdfHeight - 40) { // 20pt margin top/bottom
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
    setPrescriptionContent({
      productDetails: '',
      dosageInstruction: '',
      justification: '',
      usageType: 'USO ORAL',
      isContinuousUse: false,
      emissionDate: new Date().toLocaleDateString('pt-BR')
    });
  }, [patient]);

  const handleMockAIFill = () => {
    toast.info("Simulating AI filling prescription...");
    setPrescriptionContent({
      ...prescriptionContent,
      productDetails: "Cannabis Sativa L. Extract - Full Spectrum CBD Oil - 3000mg (30ml) - THC <0.3%",
      dosageInstruction: "Iniciar com 2 gotas (aproximadamente 5mg de CBD) via sublingual, 2 vezes ao dia (manhã e noite). Após 7 dias, se bem tolerado e necessário, aumentar para 3 gotas, 2 vezes ao dia. Ajustar conforme orientação médica, não exceder 10 gotas/dia sem supervisão.",
      justification: "Paciente com diagnóstico de ansiedade crônica e insônia, refratário a tratamentos convencionais. O uso de CBD visa modular a resposta ao estresse e melhorar a qualidade do sono.",
      usageType: "USO SUBLINGUAL",
      isContinuousUse: true,
    });
  };
  
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
    <div className="space-y-4 p-1">
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
        
        {/* This is the section that will be captured by html2canvas */}
        <CardContent ref={prescriptionContentRef} className="space-y-5 p-6 bg-white text-black text-sm printable-area">
          {/* Doctor's Letterhead Section - As per example */}
          <div className="mb-6 text-center border-b pb-4 border-gray-300">
            {doctorDetails?.profile_picture_url && (
              <img 
                src={doctorDetails.profile_picture_url} 
                alt="Doctor Logo" 
                className="mx-auto mb-3 object-contain" // Centered and maintain aspect ratio
                style={{ maxHeight: '70px', maxWidth: '220px' }} // Adjusted style
                crossOrigin="anonymous" // Important for html2canvas
              />
            )}
            <h1 className="text-xl font-bold text-gray-800">{doctorDetails?.name || "Doctor Name N/A"}</h1>
            <p className="text-xs text-gray-600">
              CRM: {doctorDetails?.crm || "N/A"} 
              {doctorDetails?.specialty && ` | Specialty: ${doctorDetails.specialty}`}
            </p>
            <p className="text-xs text-gray-600">{doctorDetails?.clinic_address || "Clinic Address N/A"}</p>
            <p className="text-xs text-gray-600">
              Email: {doctorDetails?.email || "N/A"} 
              {doctorDetails?.clinic_phone && ` | Phone: ${doctorDetails.clinic_phone}`}
            </p>
          </div>
          
          <div className="border-y border-gray-300 py-3 my-4">
             <h3 className="text-sm font-semibold mb-2 text-center uppercase text-gray-700 tracking-wider">Patient Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-700">
              <div><span className="font-medium">Name:</span> {patientName || "N/A"}</div>
              <div><span className="font-medium">ID/RG/CPF:</span> {patientRg || "N/A"}</div>
              <div><span className="font-medium">Date of Birth:</span> {patientDob || "N/A"}</div>
              <div><span className="font-medium">Prescription Date:</span> {prescriptionContent.emissionDate || new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold uppercase text-center text-gray-700 mb-3 tracking-wider">Prescription</h3>
            
            <div>
                <Label className="text-xs font-semibold text-gray-700">Product Details (from AI):</Label>
                <p className="p-2.5 min-h-[28px] text-xs border border-dashed border-gray-300 rounded-md bg-gray-50 mt-1 text-gray-800 whitespace-pre-wrap">
                    {prescriptionContent.productDetails || "N/A"}
                </p>
            </div>
            
            <div>
              <Label htmlFor="dosageInstruction" className="text-xs font-semibold text-gray-700">Dosage Instructions (Posology):</Label>
              <Textarea
                id="dosageInstruction"
                value={prescriptionContent.dosageInstruction}
                onChange={(e) => handlePrescriptionChange('dosageInstruction', e.target.value)}
                placeholder="e.g., 2 gotas, 2 vezes ao dia..."
                className="min-h-[80px] mt-1 text-xs p-2.5 border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end pt-2">
              <div>
                <Label htmlFor="usageType" className="text-xs font-semibold text-gray-700">Usage Type:</Label>
                <Select
                  value={prescriptionContent.usageType}
                  onValueChange={(value) => handlePrescriptionChange('usageType', value)}
                >
                  <SelectTrigger id="usageType" className="mt-1 text-xs h-9 border-gray-300 focus:ring-primary-500 focus:border-primary-500">
                    <SelectValue placeholder="Select usage type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USO ORAL">USO ORAL</SelectItem>
                    <SelectItem value="USO TÓPICO">USO TÓPICO</SelectItem>
                    <SelectItem value="USO SUBLINGUAL">USO SUBLINGUAL</SelectItem>
                    <SelectItem value="USO INALATÓRIO">USO INALATÓRIO</SelectItem>
                    <SelectItem value="OUTRO">OUTRO (especificar em posologia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-1 pb-1 md:pt-5"> {/* Adjusted alignment for checkbox */}
                <Checkbox
                  id="isContinuousUse"
                  checked={!!prescriptionContent.isContinuousUse}
                  onCheckedChange={(checked) => handlePrescriptionChange('isContinuousUse', !!checked)}
                  className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label htmlFor="isContinuousUse" className="text-xs font-medium text-gray-700">
                  Continuous Use
                </Label>
              </div>
            </div>
            
            {prescriptionContent.justification && (
                <div>
                    <Label className="text-xs font-semibold text-gray-700">Medical Justification (from AI):</Label>
                    <p className="p-2.5 min-h-[28px] text-xs border border-dashed border-gray-300 rounded-md bg-gray-50 mt-1 text-gray-800 whitespace-pre-wrap">
                        {prescriptionContent.justification}
                    </p>
                </div>
            )}
          </div>
          
          {/* Signature Area */}
          <div className="pt-20 text-center"> {/* Increased top padding for more space */}
             <div className="inline-block">
                <div className="border-t-2 border-black w-72 mx-auto pt-1.5 text-xs text-gray-700">
                  Doctor's Signature
                </div>
                <p className="text-sm font-medium mt-1 text-gray-800">{doctorDetails?.name || "Doctor Name N/A"}</p>
                <p className="text-xs text-gray-600">CRM: {doctorDetails?.crm || "N/A"}</p>
             </div>
           </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-4 bg-slate-50 border-t">
            <Button onClick={handleMockAIFill} variant="outline" size="sm">
                <LucideSparkles className="h-3.5 w-3.5 mr-1.5" />
                Fill with AI (Mock)
            </Button>
            <Button size="sm" onClick={() => toast.info("Save Prescription: This feature is not yet implemented.")}>
                Save Prescription
            </Button> 
        </CardFooter>
      </Card>
    </div>
  );
}