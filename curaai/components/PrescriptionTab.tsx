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
            .select('id, name, crm, clinic_address, email, specialty, clinic_phone')
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

    try {
      const canvas = await html2canvas(prescriptionElement, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width / 2;
      const imgHeight = canvas.height / 2;
      
      const ratio = imgWidth / imgHeight;
      let newCanvasWidth = pdfWidth - 40;
      let newCanvasHeight = newCanvasWidth / ratio;

      if (newCanvasHeight > pdfHeight - 40) {
        newCanvasHeight = pdfHeight - 40;
        newCanvasWidth = newCanvasHeight * ratio;
      }
      
      const xOffset = (pdfWidth - newCanvasWidth) / 2;
      const yOffset = 20;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, newCanvasWidth, newCanvasHeight);
      pdf.save(`prescription-${patient?.name?.replace(/s+/g, '_') || 'patient'}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Prescription PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. See console for details.");
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
      <div className="flex items-center justify-center h-40">
        <LucideLoader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading doctor details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Prescription Details for: {patientName || "Selected Patient"}</span>
            <Button onClick={handleDownloadPdf} variant="outline" size="sm" className="ml-auto" disabled={!doctorDetails}>
              <LucideDownload className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent ref={prescriptionContentRef} className="space-y-4 p-6 bg-white text-black text-sm">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold">{doctorDetails?.name || "Doctor Name N/A"}</h2>
            <p className="text-xs">CRM: {doctorDetails?.crm || "N/A"} {doctorDetails?.specialty && `| ${doctorDetails.specialty}`}</p>
            <p className="text-xs">{doctorDetails?.clinic_address || "Clinic Address N/A"}</p>
            <p className="text-xs">Email: {doctorDetails?.email || "N/A"} {doctorDetails?.clinic_phone && `| Phone: ${doctorDetails.clinic_phone}`}</p>
          </div>
          
          <div className="border-y border-gray-300 py-3 my-3">
             <h3 className="text-sm font-semibold mb-1 text-center uppercase">Patient Information</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div><span className="font-medium">Name:</span> {patientName}</div>
              <div><span className="font-medium">ID/RG/CPF:</span> {patientRg}</div>
              <div><span className="font-medium">Date of Birth:</span> {patientDob}</div>
              <div><span className="font-medium">Prescription Date:</span> {prescriptionContent.emissionDate}</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold uppercase text-center">Prescription</h3>
            
            <div>
                <Label className="text-xs font-semibold">Product Details (from AI):</Label>
                <p className="p-2 min-h-[24px] text-xs border border-dashed border-gray-200 rounded-sm bg-gray-50/50 mt-1">
                    {prescriptionContent.productDetails || "N/A"}
                </p>
            </div>
            
            <div>
              <Label htmlFor="dosageInstruction" className="text-xs font-semibold">Dosage Instructions (Posology)</Label>
              <Textarea
                id="dosageInstruction"
                value={prescriptionContent.dosageInstruction}
                onChange={(e) => handlePrescriptionChange('dosageInstruction', e.target.value)}
                placeholder="e.g., 2 gotas, 2 vezes ao dia..."
                className="min-h-[80px] mt-1 text-xs p-2"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="usageType" className="text-xs font-semibold">Usage Type</Label>
                <Select
                  value={prescriptionContent.usageType}
                  onValueChange={(value) => handlePrescriptionChange('usageType', value)}
                >
                  <SelectTrigger id="usageType" className="mt-1 text-xs h-9">
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
              <div className="flex items-center space-x-2 mt-1 pb-1 md:pt-5">
                <Checkbox
                  id="isContinuousUse"
                  checked={!!prescriptionContent.isContinuousUse}
                  onCheckedChange={(checked) => handlePrescriptionChange('isContinuousUse', !!checked)}
                />
                <Label htmlFor="isContinuousUse" className="text-xs font-medium">
                  Continuous Use
                </Label>
              </div>
            </div>
            
            {prescriptionContent.justification && (
                <div>
                    <Label className="text-xs font-semibold">Medical Justification (from AI):</Label>
                    <p className="p-2 min-h-[24px] text-xs border border-dashed border-gray-200 rounded-sm bg-gray-50/50 mt-1">
                        {prescriptionContent.justification}
                    </p>
                </div>
            )}
          </div>
          
          <div className="pt-12 text-center">
             <div className="inline-block mt-8">
                <div className="border-t border-black w-56 mx-auto pt-1 text-[10px]">
                  Doctor's Signature
                </div>
                <p className="text-xs font-medium mt-0.5">{doctorDetails?.name || "Doctor Name N/A"}</p>
                <p className="text-[10px]">CRM: {doctorDetails?.crm || "N/A"}</p>
             </div>
           </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 pt-4">
            <Button onClick={handleMockAIFill} variant="outline" size="sm">
                <LucideSparkles className="h-3.5 w-3.5 mr-1.5" />
                Fill with AI (Mock)
            </Button>
            <Button size="sm" onClick={() => toast.info("Save Prescription: Not yet implemented.")}>
                Save Prescription
            </Button> 
        </CardFooter>
      </Card>
    </div>
  );
} 