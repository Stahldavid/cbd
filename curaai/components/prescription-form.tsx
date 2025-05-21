"use client"

import React, { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { 
  LucideFileDown, 
  LucideRefreshCw, 
  LucideX, 
  LucideCheck, 
  LucideClipboard,
  LucideArrowRight
} from "lucide-react"
import { usePatient } from "@/contexts/PatientContext"
import { useAuth } from "@/contexts/AuthContext"
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { calculateAge } from "@/lib/patientUtils"

// List of available CBD products based on the backend tools config
const AVAILABLE_PRODUCTS = [
  'CBD Isolado CURA CANNABIS',
  'CBG Isolado',
  'CBN Isolado',
  'CBD:CBN (1:1)',
  'CBD:CBN (2:1)',
  'CBD:CBG (1:1)',
  'CBD:CBG (2:1)',
  'CBD:CBG (3:1)',
  'CBD:CBN:CBG (2:1:1)',
  'CBD:Delta-8 THC (1:1)',
  'CBD:Delta-8 THC (2:1)',
  'CBD:Delta-9 THC (1:1)',
  'CBD:Delta-9 THC (2:1)',
  'THCV Isolado',
  'CBD:THCV (2:1)',
  'CBD:CBG:THCV (2:1:1)',
  'CBD:CBG:CBN (2:1:1)',
  'CBD:CBG:Delta-9 THC (2:1:1)',
  'CBD:CBN:Delta-9 THC (2:1:1)',
  'CBD:CBG:CBN:Delta-9 THC (2:1:1:1)',
  'CBD:CBG:CBN:THCV (2:1:1:1)',
  'CBD:CBG:CBN:Delta-8 THC (2:1:1:1)',
  'CBD:CBG:CBN:Delta-9 THC:THCV (2:1:1:1:1)',
];

import { usePrescription } from "@/lib/prescriptionContext"
import { PrescriptionSuggestion } from "@/lib/prescriptionService"

// Types
interface PrescriptionData {
  productDetails: string;
  dosageInstruction: string;
  justification: string;
  usageType: string;
  isContinuousUse: boolean;
  patientName: string;
  patientRG: string;
  patientCPF: string;
  patientDOB: string;
  patientAge: string;
  patientAddress: string;
  emissionDate: string;
}

interface DoctorSettings {
  name: string;
  crm: string;
  specialty: string;
  address: string;
  phone: string;
  email: string;
}

export function PrescriptionForm() {
  const { activePatient } = usePatient();
  const { user, doctorId } = useAuth();
  const { toast } = useToast();
  const prescriptionRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({
    productDetails: '',
    dosageInstruction: '',
    justification: '',
    usageType: 'USO ORAL',
    isContinuousUse: false,
    patientName: '',
    patientRG: '',
    patientCPF: '',
    patientDOB: '',
    patientAge: '',
    patientAddress: '',
    emissionDate: new Date().toLocaleDateString('pt-BR')
  });
  
  // Doctor settings
  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>({
    name: user?.user_metadata?.full_name || '',
    crm: user?.user_metadata?.crm || '',
    specialty: user?.user_metadata?.specialty || '',
    address: user?.user_metadata?.clinic_address || '',
    phone: user?.user_metadata?.clinic_phone || '',
    email: user?.email || '',
  });
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Get suggestions from prescription context
  const { suggestions } = usePrescription();

  // Update form with active patient data
  useEffect(() => {
    if (activePatient) {
      setPrescriptionData(prev => ({
        ...prev,
        patientName: activePatient.name || '',
        patientRG: activePatient.rg || '',
        patientCPF: activePatient.cpf || '',
        patientDOB: activePatient.date_of_birth || '',
        patientAge: activePatient.date_of_birth ? calculateAge(activePatient.date_of_birth) : '',
        patientAddress: activePatient.address || '',
      }));
    }
  }, [activePatient]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPrescriptionData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPrescriptionData(prev => ({ ...prev, [name]: value }));
  };

  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setPrescriptionData(prev => ({ ...prev, [name]: checked }));
  };

  // Generate PDF function
  const generatePDF = async () => {
    if (!prescriptionRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Temporarily modify styles for PDF
      const element = prescriptionRef.current;
      const originalBackgroundColor = element.style.backgroundColor;
      element.style.backgroundColor = 'white';
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      // Reset styles
      element.style.backgroundColor = originalBackgroundColor;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const fileName = prescriptionData.patientName
        ? `receituario_${prescriptionData.patientName.replace(/\s+/g, '_')}.pdf`
        : 'receituario_medico.pdf';
        
      pdf.save(fileName);
      toast({
        title: "PDF gerado com sucesso",
        description: `Arquivo ${fileName} salvo.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Apply AI-generated prescription
  const applyPrescription = (generatedData: any) => {
    if (!generatedData) return;
    
    setPrescriptionData(prev => ({
      ...prev,
      productDetails: generatedData.productDetails || prev.productDetails,
      dosageInstruction: generatedData.dosageInstruction || prev.dosageInstruction,
      justification: generatedData.justification || prev.justification,
      usageType: generatedData.usageType || prev.usageType,
      isContinuousUse: generatedData.isContinuousUse ?? prev.isContinuousUse
    }));
    
    toast({
      title: "Prescrição aplicada",
      description: "Os detalhes da prescrição foram atualizados conforme recomendado pelo assistente.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Patient Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Informações do Paciente</CardTitle>
              <CardDescription>
                Dados do paciente para a prescrição médica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nome</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    value={prescriptionData.patientName}
                    onChange={handleInputChange}
                    readOnly={!!activePatient}
                    className={activePatient ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientRG">RG</Label>
                  <Input
                    id="patientRG"
                    name="patientRG"
                    value={prescriptionData.patientRG}
                    onChange={handleInputChange}
                    readOnly={!!activePatient}
                    className={activePatient ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientCPF">CPF</Label>
                  <Input
                    id="patientCPF"
                    name="patientCPF"
                    value={prescriptionData.patientCPF}
                    onChange={handleInputChange}
                    readOnly={!!activePatient}
                    className={activePatient ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientDOB">Data de Nascimento</Label>
                  <Input
                    id="patientDOB"
                    name="patientDOB"
                    type="date"
                    value={prescriptionData.patientDOB ? prescriptionData.patientDOB.split('T')[0] : ''}
                    onChange={handleInputChange}
                    readOnly={!!activePatient}
                    className={activePatient ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="patientAddress">Endereço</Label>
                  <Input
                    id="patientAddress"
                    name="patientAddress"
                    value={prescriptionData.patientAddress}
                    onChange={handleInputChange}
                    readOnly={!!activePatient}
                    className={activePatient ? "bg-muted" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Detalhes da Prescrição</CardTitle>
              <CardDescription>
                Informações sobre o produto e posologia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productDetails">Produto Prescrito</Label>
                <Select 
                  value={prescriptionData.productDetails} 
                  onValueChange={(value) => handleSelectChange('productDetails', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_PRODUCTS.map((product) => (
                      <SelectItem key={product} value={product}>
                        {product}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageType">Tipo de Uso</Label>
                  <Select 
                    value={prescriptionData.usageType} 
                    onValueChange={(value) => handleSelectChange('usageType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                
                <div className="flex items-end space-x-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isContinuousUse"
                      checked={prescriptionData.isContinuousUse}
                      onCheckedChange={(checked) => handleSwitchChange('isContinuousUse', checked)}
                    />
                    <Label htmlFor="isContinuousUse">Uso Contínuo</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dosageInstruction">Posologia (Instruções de Uso)</Label>
                <Textarea
                  id="dosageInstruction"
                  name="dosageInstruction"
                  value={prescriptionData.dosageInstruction}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Ex: Tomar 10 gotas, 2 vezes ao dia, por 60 dias"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="justification">Justificativa Médica</Label>
                <Textarea
                  id="justification"
                  name="justification"
                  value={prescriptionData.justification}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Justificativa para a prescrição baseada em evidências"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Pré-visualização da Receita</CardTitle>
            <CardDescription>
              Como a receita ficará ao ser impressa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              ref={prescriptionRef} 
              className="border border-border rounded-lg p-6 bg-white text-black"
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">RECEITUÁRIO MÉDICO</h2>
                <p className="text-sm text-gray-600">(Receita médica simples branca)</p>
              </div>

              {/* Patient Section */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold uppercase text-blue-600 mb-2">Paciente</h4>
                
                <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                  <span className="font-medium text-gray-600">Nome:</span>
                  <span>{prescriptionData.patientName || '____________________'}</span>
                  
                  <span className="font-medium text-gray-600">RG:</span>
                  <span>{prescriptionData.patientRG || '____________________'}</span>
                  
                  {prescriptionData.patientCPF && (
                    <>
                      <span className="font-medium text-gray-600">CPF:</span>
                      <span>{prescriptionData.patientCPF}</span>
                    </>
                  )}
                  
                  <span className="font-medium text-gray-600">Data de Nasc.:</span>
                  <span>
                    {prescriptionData.patientDOB
                      ? new Date(prescriptionData.patientDOB).toLocaleDateString('pt-BR')
                      : '____/____/____'}
                  </span>
                  
                  <span className="font-medium text-gray-600">Idade:</span>
                  <span>{prescriptionData.patientAge || '____________________'}</span>
                  
                  {prescriptionData.patientAddress && (
                    <>
                      <span className="font-medium text-gray-600">Endereço:</span>
                      <span>{prescriptionData.patientAddress}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Prescription Section */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-semibold uppercase text-blue-600 mb-2">Prescrição</h4>
                
                <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                  <span className="font-medium text-gray-600">Produto:</span>
                  <span className="font-bold">{prescriptionData.productDetails || '____________________'}</span>
                  
                  <span className="font-medium text-gray-600">Tipo de Uso:</span>
                  <span>
                    {prescriptionData.usageType || 'USO ORAL'}
                    {prescriptionData.isContinuousUse ? ' (Uso Contínuo)' : ''}
                  </span>
                  
                  <span className="font-medium text-gray-600">Posologia:</span>
                  <span className="whitespace-pre-wrap">{prescriptionData.dosageInstruction || '____________________'}</span>
                  
                  {prescriptionData.justification && (
                    <>
                      <span className="font-medium text-gray-600">Justificativa:</span>
                      <span className="whitespace-pre-wrap">{prescriptionData.justification}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Section */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Data de Emissão: {prescriptionData.emissionDate}
                </p>
                
                <div className="border-t border-gray-500 w-3/5 mx-auto mt-10 mb-2"></div>
                
                <p className="font-bold">
                  {doctorSettings.name}<br />
                  {doctorSettings.specialty && `${doctorSettings.specialty} - `}
                  CRM: {doctorSettings.crm}
                </p>
                
                {(doctorSettings.address || doctorSettings.phone) && (
                  <p className="text-xs text-gray-600 mt-1">
                    {doctorSettings.address}
                    {doctorSettings.address && doctorSettings.phone ? ' - ' : ''}
                    {doctorSettings.phone}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setPrescriptionData({
                productDetails: '',
                dosageInstruction: '',
                justification: '',
                usageType: 'USO ORAL',
                isContinuousUse: false,
                patientName: activePatient?.name || '',
                patientRG: activePatient?.rg || '',
                patientCPF: activePatient?.cpf || '',
                patientDOB: activePatient?.date_of_birth || '',
                patientAge: activePatient?.date_of_birth ? calculateAge(activePatient.date_of_birth) : '',
                patientAddress: activePatient?.address || '',
                emissionDate: new Date().toLocaleDateString('pt-BR')
              })}
            >
              <LucideRefreshCw className="h-4 w-4 mr-2" />
              Limpar Prescrição
            </Button>
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF || !prescriptionData.productDetails || !prescriptionData.dosageInstruction}
            >
              {isGeneratingPDF ? (
                <LucideRefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LucideFileDown className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? "Gerando PDF..." : "Baixar PDF"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Prescription Messages History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Prescrições Geradas pelo Assistente</CardTitle>
          <CardDescription>
            Prescrições sugeridas pelo assistente durante a consulta atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{suggestion.productDetails}</h4>
                      <p className="text-xs text-muted-foreground">{suggestion.dosageInstruction}</p>
                      {suggestion.justification && (
                        <p className="text-xs mt-1 text-muted-foreground italic">
                          Justificativa: {suggestion.justification.length > 100 
                            ? suggestion.justification.substring(0, 100) + '...' 
                            : suggestion.justification}
                        </p>
                      )}
                      <p className="text-xs mt-1 text-muted-foreground">
                        Sugerido em: {new Date(suggestion.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          applyPrescription(suggestion);
                        }}
                      >
                        <LucideArrowRight className="h-4 w-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">CBD Isolado CURA CANNABIS</h4>
                    <p className="text-xs text-muted-foreground">Tomar 10 gotas, 2 vezes ao dia, por 60 dias</p>
                    <p className="text-xs mt-1 italic text-muted-foreground">
                      Justificativa: O paciente apresenta insônia crônica resistente ao tratamento convencional...
                    </p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      (Exemplo apenas para demonstração)
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        // Apply sample prescription for demo
                        applyPrescription({
                          productDetails: "CBD Isolado CURA CANNABIS",
                          dosageInstruction: "Tomar 10 gotas, 2 vezes ao dia, por 60 dias",
                          justification: "O paciente apresenta insônia crônica resistente ao tratamento convencional. Estudos recentes (PMID: 32147068) demonstram eficácia do CBD isolado no tratamento da insônia, com melhora significativa na qualidade do sono.",
                          usageType: "USO ORAL",
                          isContinuousUse: false
                        });
                      }}
                    >
                      <LucideArrowRight className="h-4 w-4 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PrescriptionForm;
