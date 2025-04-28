// // PrescriptionModal.js - Modal do receituário com função de download

// import React from 'react';
// import styled from 'styled-components';
// import { ActionButton } from './ChatSection';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// // --- Prescription Modal Components ---
// const ModalOverlay = styled.div`
//   position: fixed;
//   top: 0;
//   left: 0;
//   right: 0;
//   bottom: 0;
//   background-color: ${props => props.theme.colors.modalOverlay};
//   display: ${props => props.isOpen ? 'flex' : 'none'};
//   justify-content: center;
//   align-items: center;
//   z-index: 1000;
//   padding: 1rem;
// `;

// const ModalContent = styled.div`
//   background-color: ${props => props.theme.colors.modalBackground};
//   border-radius: 8px;
//   max-width: 800px;
//   width: 100%;
//   max-height: 90vh;
//   overflow-y: auto;
//   box-shadow: ${props => props.theme.shadows.main};
//   display: flex;
//   flex-direction: column;
// `;

// const ModalHeader = styled.div`
//   display: flex;
//   justify-content: space-between;
//   align-items: center;
//   padding: 1rem 1.5rem;
//   border-bottom: 1px solid ${props => props.theme.colors.border};
  
//   h2 {
//     font-size: 1.25rem;
//     margin: 0;
//     color: ${props => props.theme.colors.lightText};
//   }
// `;

// const ModalBody = styled.div`
//   padding: 1.5rem;
//   overflow-y: auto;
//   display: flex;
//   flex-direction: column;
//   gap: 1.5rem;
// `;

// const ModalFooter = styled.div`
//   display: flex;
//   justify-content: flex-end;
//   gap: 1rem;
//   padding: 1rem 1.5rem;
//   border-top: 1px solid ${props => props.theme.colors.border};
// `;

// const CloseButton = styled.button`
//   border: none;
//   background: none;
//   color: ${props => props.theme.colors.lightText};
//   cursor: pointer;
//   font-size: 1.25rem;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   width: 2rem;
//   height: 2rem;
//   border-radius: 50%;
//   transition: background-color 0.2s ease;
  
//   &:hover {
//     background-color: rgba(255, 255, 255, 0.1);
//   }
// `;

// // --- Prescription Input Components ---
// const PrescriptionPanel = styled.div`
//   background-color: ${props => props.theme.colors.messageBg}; 
//   border: 1px solid ${props => props.theme.colors.border};
//   border-radius: 8px; 
//   padding: 1rem 1.5rem; 
//   margin-bottom: 1.5rem; 
//   box-shadow: ${props => props.theme.shadows.main};
  
//   h3 { 
//     margin-top: 0; 
//     margin-bottom: 1rem; 
//     font-size: 1.1rem; 
//     font-weight: 600; 
//     color: ${props => props.theme.colors.primary}; 
//   }
// `;

// const PatientInputGroup = styled.div`
//   display: grid; 
//   grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
//   gap: 1rem; 
//   margin-bottom: 1rem;
// `;

// const PatientInputLabel = styled.label`
//   display: block; 
//   margin-bottom: 0.25rem; 
//   font-size: 0.875rem; 
//   font-weight: 500; 
//   color: ${props => props.theme.colors.prescriptionLabel};
// `;

// const PatientInputField = styled.input`
//   width: 100%; 
//   padding: 0.5rem 0.75rem; 
//   border: 1px solid ${props => props.theme.colors.prescriptionBorder};
//   border-radius: 4px; 
//   font-size: 0.95rem; 
//   background-color: ${props => props.theme.colors.background}; 
//   color: ${props => props.theme.colors.text};
//   transition: border-color 0.2s ease-in-out;
  
//   &:focus { 
//     outline: none; 
//     border-color: ${props => props.theme.colors.primary}; 
//     box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); 
//   }
// `;

// // --- Prescription Display Components ---
// const PrescriptionDisplayContainer = styled.div`
//   border: 1px dashed ${props => props.theme.colors.prescriptionBorder}; 
//   border-radius: 8px; 
//   padding: 1.5rem;
//   margin-bottom: 1.5rem; 
//   background-color: ${props => props.theme.colors.messageBg};
  
//   h2 { 
//     text-align: center; 
//     font-size: 1.25rem; 
//     margin-top: 0; 
//     margin-bottom: 0.25rem; 
//   }
  
//   p.subtitle { 
//     text-align: center; 
//     font-size: 0.9rem; 
//     color: ${props => props.theme.colors.prescriptionLabel}; 
//     margin-bottom: 1.5rem; 
//   }
// `;

// const PrescriptionSection = styled.div`
//   margin-bottom: 1.5rem; 
//   padding-bottom: 1rem; 
//   border-bottom: 1px solid ${props => props.theme.colors.border};
  
//   &:last-child { 
//     border-bottom: none; 
//     margin-bottom: 0; 
//     padding-bottom: 0; 
//   }
  
//   h4 { 
//     font-size: 0.9rem; 
//     font-weight: 600; 
//     color: ${props => props.theme.colors.primary}; 
//     margin-bottom: 0.75rem; 
//     text-transform: uppercase; 
//     letter-spacing: 0.05em; 
//   }
// `;

// const PrescriptionField = styled.div` 
//   margin-bottom: 0.6rem; 
//   display: flex; 
//   flex-wrap: wrap; 
// `;

// const PrescriptionLabel = styled.span`
//   font-size: 0.9rem; 
//   color: ${props => props.theme.colors.prescriptionLabel}; 
//   margin-right: 0.5rem; 
//   font-weight: 500; 
//   min-width: 120px;
// `;

// const PrescriptionValue = styled.span`
//   font-size: 0.95rem; 
//   color: ${props => props.theme.colors.text}; 
//   white-space: pre-wrap; 
//   word-break: break-word;
// `;

// const PrescriptionFooter = styled.div`
//   margin-top: 2rem; 
//   text-align: center; 
//   font-size: 0.9rem; 
//   color: ${props => props.theme.colors.prescriptionLabel};
  
//   .signature-line { 
//     display: block; 
//     margin-top: 3rem; 
//     margin-bottom: 0.5rem; 
//     border-top: 1px solid ${props => props.theme.colors.text}; 
//     width: 60%; 
//     margin-left: auto; 
//     margin-right: auto; 
//   }
  
//   .doctor-info {
//     margin-top: 0.5rem;
//     font-weight: bold;
//   }
  
//   .doctor-address {
//     margin-top: 0.5rem;
//     font-size: 0.8rem;
//   }
  
//   .logo-container {
//     margin-top: 1rem;
//     display: flex;
//     justify-content: center;
    
//     img {
//       max-height: 80px;
//       max-width: 200px;
//     }
//   }
// `;

// // Função para gerar o PDF
// const generatePDF = (prescriptionData) => {
//   // Referência ao elemento que contém o receituário
//   const prescriptionElement = document.getElementById('prescription-display');
  
//   if (!prescriptionElement) return;
  
//   // Definir background branco para o PDF
//   const originalBg = prescriptionElement.style.backgroundColor;
//   const originalColor = prescriptionElement.style.color;
//   prescriptionElement.style.backgroundColor = '#ffffff';
//   prescriptionElement.style.color = '#000000';
  
//   // Mudar cores dos elementos internos para melhor visibilidade no PDF
//   const labels = prescriptionElement.querySelectorAll('[data-prescription-label="true"]');
//   const values = prescriptionElement.querySelectorAll('[data-prescription-value="true"]');
//   const headings = prescriptionElement.querySelectorAll('h4');
//   const subtitle = prescriptionElement.querySelector('.subtitle');
  
//   // Armazenar cores originais
//   const originalStyles = [];
  
//   // Aplicar cores escuras para impressão
//   labels.forEach(label => {
//     originalStyles.push({ element: label, color: label.style.color });
//     label.style.color = '#4b5563';
//   });
  
//   values.forEach(value => {
//     originalStyles.push({ element: value, color: value.style.color });
//     value.style.color = '#111827';
//   });
  
//   headings.forEach(heading => {
//     originalStyles.push({ element: heading, color: heading.style.color });
//     heading.style.color = '#2563eb';
//   });
  
//   if (subtitle) {
//     originalStyles.push({ element: subtitle, color: subtitle.style.color });
//     subtitle.style.color = '#6b7280';
//   }
  
//   // Gerar o canvas do elemento
//   html2canvas(prescriptionElement, {
//     scale: 2, // Aumentar qualidade
//     useCORS: true,
//     backgroundColor: '#ffffff',
//     logging: false,
//   }).then(canvas => {
//     const imgData = canvas.toDataURL('image/png');
    
//     // Criar PDF do tamanho A4
//     const pdf = new jsPDF({
//       orientation: 'portrait',
//       unit: 'mm',
//       format: 'a4'
//     });
    
//     const imgWidth = 210; // A4 width in mm
//     const pageHeight = 297; // A4 height in mm
//     const imgHeight = canvas.height * imgWidth / canvas.width;
//     let heightLeft = imgHeight;
//     let position = 0;
    
//     // Adicionar a primeira página
//     pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//     heightLeft -= pageHeight;
    
//     // Adicionar páginas adicionais se necessário
//     while (heightLeft >= 0) {
//       position = heightLeft - imgHeight;
//       pdf.addPage();
//       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;
//     }
    
//     // Definir nome do arquivo com o nome do paciente se disponível
//     const fileName = prescriptionData.patientName 
//       ? `receituario_${prescriptionData.patientName.replace(/\s+/g, '_')}.pdf` 
//       : 'receituario_medico.pdf';
    
//     // Gerar o download
//     pdf.save(fileName);
    
//     // Restaurar cores originais
//     prescriptionElement.style.backgroundColor = originalBg;
//     prescriptionElement.style.color = originalColor;
    
//     originalStyles.forEach(item => {
//       item.element.style.color = item.color;
//     });
//   });
// };

// // Componente do Modal de Receituário
// export function PrescriptionModal({ 
//   isOpen, 
//   onClose, 
//   prescriptionData, 
//   handlePrescriptionChange,
//   doctorSettings
// }) {
//   return (
//     <ModalOverlay isOpen={isOpen}>
//       <ModalContent>
//         <ModalHeader>
//           <h2>Receituário Médico</h2>
//           <CloseButton onClick={onClose}>×</CloseButton>
//         </ModalHeader>
//         <ModalBody>
//           {/* Dados do Paciente */}
//           <PrescriptionPanel>
//             <h3>Dados do Paciente</h3>
//             <PatientInputGroup>
//               <div>
//                 <PatientInputLabel htmlFor="patientName" data-prescription-label="true">Nome completo:</PatientInputLabel>
//                 <PatientInputField type="text" id="patientName" name="patientName" data-prescription-field="true" value={prescriptionData.patientName} onChange={handlePrescriptionChange} />
//               </div>
//               <div>
//                 <PatientInputLabel htmlFor="patientAddress" data-prescription-label="true">Endereço completo:</PatientInputLabel>
//                 <PatientInputField type="text" id="patientAddress" name="patientAddress" data-prescription-field="true" value={prescriptionData.patientAddress} onChange={handlePrescriptionChange} />
//               </div>
//               <div>
//                 <PatientInputLabel htmlFor="patientDOB" data-prescription-label="true">Data de nascimento:</PatientInputLabel>
//                 <PatientInputField type="date" id="patientDOB" name="patientDOB" data-prescription-field="true" value={prescriptionData.patientDOB} onChange={handlePrescriptionChange} />
//               </div>
//               <div>
//                 <PatientInputLabel htmlFor="patientAge" data-prescription-label="true">Idade:</PatientInputLabel>
//                 <PatientInputField type="number" id="patientAge" name="patientAge" data-prescription-field="true" value={prescriptionData.patientAge} onChange={handlePrescriptionChange} min="0" />
//               </div>
//             </PatientInputGroup>
//           </PrescriptionPanel>

//           {/* Dados do Produto */}
//           <PrescriptionPanel>
//             <h3>Dados do Produto</h3>
//             <PatientInputGroup>
//               <div>
//                 <PatientInputLabel htmlFor="dosageInstruction" data-prescription-label="true">Instruções de dosagem:</PatientInputLabel>
//                 <PatientInputField
//                   type="text"
//                   id="dosageInstruction"
//                   name="dosageInstruction"
//                   data-prescription-field="true"
//                   value={prescriptionData.dosageInstruction}
//                   onChange={handlePrescriptionChange}
//                 />
//               </div>
//               <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
//                 <input
//                   type="checkbox"
//                   id="isContinuousUse"
//                   name="isContinuousUse"
//                   checked={prescriptionData.isContinuousUse}
//                   onChange={(e) => handlePrescriptionChange({
//                     target: {
//                       name: 'isContinuousUse',
//                       value: e.target.checked
//                     }
//                   })}
//                   style={{ marginRight: '0.5rem' }}
//                 />
//                 <PatientInputLabel htmlFor="isContinuousUse" data-prescription-label="true" style={{ marginBottom: 0 }}>
//                   Uso Contínuo
//                 </PatientInputLabel>
//               </div>
//             </PatientInputGroup>
//           </PrescriptionPanel>

//           {/* Prescription Display */}
//           <PrescriptionDisplayContainer id="prescription-display" data-prescription-display="true">
//             <h2>Receituário Médico</h2>
//             <p className="subtitle">(Receita médica simples branca)</p>
//             <PrescriptionSection>
//               <h4>Identificação do paciente</h4>
//               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Nome completo:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientName || '---'}</PrescriptionValue></PrescriptionField>
//               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Endereço completo:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientAddress || '---'}</PrescriptionValue></PrescriptionField>
//               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Data de nascimento:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientDOB || '---'}</PrescriptionValue></PrescriptionField>
//               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Idade:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientAge || '---'}</PrescriptionValue></PrescriptionField>
//             </PrescriptionSection>
//             {prescriptionData.isContinuousUse && ( <PrescriptionSection> <PrescriptionField><PrescriptionValue data-prescription-value="true"><strong>USO CONTÍNUO</strong></PrescriptionValue></PrescriptionField> </PrescriptionSection> )}
//             <PrescriptionSection>
//               <h4>Identificação do produto</h4>
//               <PrescriptionValue data-prescription-value="true" style={{ display: 'block', marginBottom: '1rem', whiteSpace: 'pre-line' }}>{prescriptionData.productInfo}</PrescriptionValue>
//               <PrescriptionField><PrescriptionValue data-prescription-value="true"><strong>{prescriptionData.usageType}</strong></PrescriptionValue></PrescriptionField>
//               <PrescriptionField><PrescriptionValue data-prescription-value="true">{prescriptionData.dosageInstruction || '--- Instruções de dosagem ---'}</PrescriptionValue></PrescriptionField>
//             </PrescriptionSection>
//             <PrescriptionFooter>
//               <div>Data de Emissão: {prescriptionData.emissionDate || '__/__/____'}</div>
//               <div className="signature-line"></div>
//               {doctorSettings?.doctorName ? (
//                 <>
//                   <div className="doctor-info">
//                     {doctorSettings.doctorName}
//                     {doctorSettings.crm && ` - ${doctorSettings.crm}`}
//                     {doctorSettings.phone && ` - ${doctorSettings.phone}`}
//                   </div>
//                   {doctorSettings.address && (
//                     <div className="doctor-address">{doctorSettings.address}</div>
//                   )}
//                   {doctorSettings.logo && (
//                     <div className="logo-container">
//                       <img src={doctorSettings.logo} alt="Logo/Carimbo" />
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <div style={{marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold'}}>
//                   CARIMBO COM NOME DO MÉDICO E CRM + TELEFONE + ASSINATURA OU QR-CODE
//                   <div style={{marginTop: '0.5rem', color: '#2563eb'}}>É OBRIGATÓRIO TAMBÉM INSERIR NOME E ENDEREÇO DA INSTITUIÇÃO OU DO CONSULTÓRIO ONDE FOI EMITIDA A RECEITA</div>
//                 </div>
//               )}
//             </PrescriptionFooter>
//           </PrescriptionDisplayContainer>
//         </ModalBody>
//         <ModalFooter>
//           <ActionButton className="success" onClick={() => generatePDF(prescriptionData)}>
//             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
//               <polyline points="7 10 12 15 17 10"/>
//               <line x1="12" y1="15" x2="12" y2="3"/>
//             </svg>
//             Download PDF
//           </ActionButton>
//           <ActionButton onClick={onClose}>Fechar</ActionButton>
//         </ModalFooter>
//       </ModalContent>
//     </ModalOverlay>
//   );
// }


// PrescriptionModal.js - Modal do receituário com função de download

import React from 'react';
import styled from 'styled-components';
import { ActionButton } from './ChatSection'; //
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Modal Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.modalOverlay}; //
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`; //

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.modalBackground}; //
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.main}; //
  display: flex;
  flex-direction: column;
`; //

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border}; //

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: ${props => props.theme.colors.lightText}; //
  }
`; //

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`; //

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border}; //
`; //

const CloseButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.lightText}; //
  cursor: pointer;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`; //

// --- Prescription Input Components ---
const PrescriptionPanel = styled.div`
  background-color: ${props => props.theme.colors.messageBg}; //
  border: 1px solid ${props => props.theme.colors.border}; //
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${props => props.theme.shadows.main}; //

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${props => props.theme.colors.primary}; //
  }
`; //

const PatientInputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`; //

const PatientInputLabel = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.prescriptionLabel}; //
`; //

const PatientInputField = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.theme.colors.prescriptionBorder}; //
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${props => props.theme.colors.background}; //
  color: ${props => props.theme.colors.text}; //
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}; //
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`; //

const PrescriptionTextareaField = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.theme.colors.prescriptionBorder}; //
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${props => props.theme.colors.background}; //
  color: ${props => props.theme.colors.text}; //
  transition: border-color 0.2s ease-in-out;
  min-height: 60px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary}; //
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`; //


// --- Prescription Display Components ---
const PrescriptionDisplayContainer = styled.div`
  border: 1px dashed ${props => props.theme.colors.prescriptionBorder}; //
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: ${props => props.theme.colors.messageBg}; //

  h2 {
    text-align: center;
    font-size: 1.25rem;
    margin-top: 0;
    margin-bottom: 0.25rem;
  }

  p.subtitle {
    text-align: center;
    font-size: 0.9rem;
    color: ${props => props.theme.colors.prescriptionLabel}; //
    margin-bottom: 1.5rem;
  }
`; //

const PrescriptionSection = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border}; //

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: ${props => props.theme.colors.primary}; //
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`; //

const PrescriptionField = styled.div`
  margin-bottom: 0.6rem;
  display: flex;
  flex-wrap: wrap;
`; //

const PrescriptionLabel = styled.span`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.prescriptionLabel}; //
  margin-right: 0.5rem;
  font-weight: 500;
  min-width: 120px;
`; //

const PrescriptionValue = styled.span`
  font-size: 0.95rem;
  color: ${props => props.theme.colors.text}; //
  white-space: pre-wrap;
  word-break: break-word;
`; //

const PrescriptionFooter = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.prescriptionLabel}; //

  .signature-line {
    display: block;
    margin-top: 3rem;
    margin-bottom: 0.5rem;
    border-top: 1px solid ${props => props.theme.colors.text}; //
    width: 60%;
    margin-left: auto;
    margin-right: auto;
  }

  .doctor-info {
    margin-top: 0.5rem;
    font-weight: bold;
  }

  .doctor-address {
    margin-top: 0.5rem;
    font-size: 0.8rem;
  }

  .logo-container {
    margin-top: 1rem;
    display: flex;
    justify-content: center;

    img {
      max-height: 80px;
      max-width: 200px;
    }
  }
`; //


// Função para gerar o PDF (sem alterações necessárias aqui)
const generatePDF = (prescriptionData) => { //
    const prescriptionElement = document.getElementById('prescription-display'); //
    if (!prescriptionElement) return; //
    const originalBg = prescriptionElement.style.backgroundColor; //
    const originalColor = prescriptionElement.style.color; //
    prescriptionElement.style.backgroundColor = '#ffffff'; //
    prescriptionElement.style.color = '#000000'; //
    const labels = prescriptionElement.querySelectorAll('[data-prescription-label="true"]'); //
    const values = prescriptionElement.querySelectorAll('[data-prescription-value="true"]'); //
    const headings = prescriptionElement.querySelectorAll('h4'); //
    const subtitle = prescriptionElement.querySelector('.subtitle'); //
    const originalStyles = []; //
    labels.forEach(label => { originalStyles.push({ element: label, color: label.style.color }); label.style.color = '#4b5563'; }); //
    values.forEach(value => { originalStyles.push({ element: value, color: value.style.color }); value.style.color = '#111827'; }); //
    headings.forEach(heading => { originalStyles.push({ element: heading, color: heading.style.color }); heading.style.color = '#2563eb'; }); //
    if (subtitle) { originalStyles.push({ element: subtitle, color: subtitle.style.color }); subtitle.style.color = '#6b7280'; } //

    html2canvas(prescriptionElement, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false }) //
        .then(canvas => { //
            const imgData = canvas.toDataURL('image/png'); //
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }); //
            const imgWidth = 210; //
            const pageHeight = 297; //
            const imgHeight = canvas.height * imgWidth / canvas.width; //
            let heightLeft = imgHeight; //
            let position = 0; //
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); //
            heightLeft -= pageHeight; //
            while (heightLeft >= 0) { //
                position = heightLeft - imgHeight; //
                pdf.addPage(); //
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); //
                heightLeft -= pageHeight; //
            }
            const fileName = prescriptionData.patientName ? `receituario_${prescriptionData.patientName.replace(/\s+/g, '_')}.pdf` : 'receituario_medico.pdf'; //
            pdf.save(fileName); //
            prescriptionElement.style.backgroundColor = originalBg; //
            prescriptionElement.style.color = originalColor; //
            originalStyles.forEach(item => { item.element.style.color = item.color; }); //
        });
};

// Componente do Modal de Receituário
export function PrescriptionModal({ //
  isOpen, //
  onClose, //
  prescriptionData, //
  handlePrescriptionChange, //
  doctorSettings //
}) {
  return ( //
    <ModalOverlay isOpen={isOpen}> {/* */}
      <ModalContent> {/* */}
        <ModalHeader> {/* */}
          <h2>Receituário Médico</h2> {/* */}
          <CloseButton onClick={onClose}>×</CloseButton> {/* */}
        </ModalHeader> {/* */}
        <ModalBody> {/* */}
          {/* Dados do Paciente (Inputs) */}
          <PrescriptionPanel> {/* */}
            <h3>Dados do Paciente</h3> {/* */}
             <PatientInputGroup> {/* */}
               <div> {/* */}
                 <PatientInputLabel htmlFor="patientName">Nome completo:</PatientInputLabel> {/* */}
                 <PatientInputField type="text" id="patientName" name="patientName" value={prescriptionData.patientName} onChange={handlePrescriptionChange} /> {/* */}
               </div> {/* */}
               <div> {/* */}
                 <PatientInputLabel htmlFor="patientAddress">Endereço completo:</PatientInputLabel> {/* */}
                 <PatientInputField type="text" id="patientAddress" name="patientAddress" value={prescriptionData.patientAddress} onChange={handlePrescriptionChange} /> {/* */}
               </div> {/* */}
               <div> {/* */}
                 <PatientInputLabel htmlFor="patientDOB">Data de nascimento:</PatientInputLabel> {/* */}
                 <PatientInputField type="date" id="patientDOB" name="patientDOB" value={prescriptionData.patientDOB} onChange={handlePrescriptionChange} /> {/* */}
               </div> {/* */}
               <div> {/* */}
                 <PatientInputLabel htmlFor="patientAge">Idade:</PatientInputLabel> {/* */}
                 <PatientInputField type="number" id="patientAge" name="patientAge" value={prescriptionData.patientAge} onChange={handlePrescriptionChange} min="0" /> {/* */}
               </div> {/* */}
             </PatientInputGroup> {/* */}
          </PrescriptionPanel> {/* */}

          {/* Dados da Prescrição (Inputs Editáveis para Dosagem e Justificativa) */}
          <PrescriptionPanel> {/* */}
             <h3>Dados da Prescrição</h3> {/* */}

             {/* *** CAMPO DE DETALHES DO PRODUTO REMOVIDO DA EDIÇÃO *** */}
             {/*
             <div style={{marginBottom: '1rem'}}>
                 <PatientInputLabel htmlFor="productInfo">Detalhes do Produto (Nome, Concentração, Forma):</PatientInputLabel>
                 <PrescriptionTextareaField
                   id="productInfo"
                   name="productInfo"
                   value={prescriptionData.productInfo || ''}
                   onChange={handlePrescriptionChange}
                   rows="3"
                 />
             </div>
             */}

             {/* Campo Editável: Instruções de Dosagem */}
             <div style={{marginBottom: '1rem'}}> {/* */}
                 <PatientInputLabel htmlFor="dosageInstruction">Instruções de Dosagem:</PatientInputLabel> {/* */}
                 <PrescriptionTextareaField // Usa Textarea para permitir mais espaço //
                   id="dosageInstruction" //
                   name="dosageInstruction" //
                   value={prescriptionData.dosageInstruction || ''} //
                   onChange={handlePrescriptionChange} //
                   rows="3" //
                 />
             </div>

             {/* Campo Editável: Justificativa */}
             <div style={{marginBottom: '1rem'}}> {/* */}
                <PatientInputLabel htmlFor="justification">Justificativa / Evidência:</PatientInputLabel> {/* */}
                <PrescriptionTextareaField // Usa Textarea //
                  id="justification" //
                  name="justification" //
                  value={prescriptionData.justification || ''} //
                  onChange={handlePrescriptionChange} //
                  rows="4" // Um pouco mais de espaço //
                />
              </div>

             {/* Campo Editável: Uso Contínuo (Checkbox) */}
             <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}> {/* */}
               <input //
                 type="checkbox" //
                 id="isContinuousUse" //
                 name="isContinuousUse" //
                 checked={!!prescriptionData.isContinuousUse} // Garante que seja booleano //
                 onChange={handlePrescriptionChange} //
                 style={{ marginRight: '0.5rem' }} //
               />
               <PatientInputLabel htmlFor="isContinuousUse" style={{ marginBottom: 0 }}> {/* */}
                 Uso Contínuo
               </PatientInputLabel> {/* */}
             </div>
          </PrescriptionPanel> {/* */}

          {/* Prescription Display (para visualização e PDF) */}
          <PrescriptionDisplayContainer id="prescription-display"> {/* */}
            <h2>Receituário Médico</h2> {/* */}
            <p className="subtitle">(Receita médica simples branca)</p> {/* */}
            <PrescriptionSection> {/* */}
              <h4>Identificação do paciente</h4> {/* */}
               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Nome completo:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientName || '---'}</PrescriptionValue></PrescriptionField> {/* */}
               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Endereço completo:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientAddress || '---'}</PrescriptionValue></PrescriptionField> {/* */}
               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Data de nascimento:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientDOB || '---'}</PrescriptionValue></PrescriptionField> {/* */}
               <PrescriptionField><PrescriptionLabel data-prescription-label="true">Idade:</PrescriptionLabel><PrescriptionValue data-prescription-value="true">{prescriptionData.patientAge || '---'}</PrescriptionValue></PrescriptionField> {/* */}
            </PrescriptionSection> {/* */}
            {prescriptionData.isContinuousUse && ( <PrescriptionSection> <PrescriptionField><PrescriptionValue data-prescription-value="true"><strong>USO CONTÍNUO</strong></PrescriptionValue></PrescriptionField> </PrescriptionSection> )} {/* */}
            <PrescriptionSection> {/* */}
              <h4>Prescrição</h4> {/* */}
              {/* Exibe productInfo aqui, mas não é mais editável acima */}
              <PrescriptionValue data-prescription-value="true" style={{ display: 'block', marginBottom: '1rem', whiteSpace: 'pre-line' }}>{prescriptionData.productInfo || '--- Detalhes do Produto ---'}</PrescriptionValue> {/* */}
              <PrescriptionField><PrescriptionValue data-prescription-value="true"><strong>{prescriptionData.usageType || 'USO ORAL'}</strong></PrescriptionValue></PrescriptionField> {/* */}
              <PrescriptionField><PrescriptionValue data-prescription-value="true">{prescriptionData.dosageInstruction || '--- Instruções de dosagem ---'}</PrescriptionValue></PrescriptionField> {/* */}
            </PrescriptionSection> {/* */}

            {/* Seção para EXIBIR Justificativa */}
            {prescriptionData.justification && ( //
              <PrescriptionSection> {/* */}
                <h4>Justificativa / Evidência</h4> {/* */}
                <PrescriptionValue data-prescription-value="true" style={{ display: 'block', whiteSpace: 'pre-line' }}> {/* */}
                  {prescriptionData.justification} {/* */}
                </PrescriptionValue> {/* */}
              </PrescriptionSection> //
            )}

            <PrescriptionFooter> {/* */}
                 <div>Data de Emissão: {prescriptionData.emissionDate || '__/__/____'}</div> {/* */}
                 <div className="signature-line"></div> {/* */}
                 {doctorSettings?.doctorName ? ( //
                   <> {/* */}
                     <div className="doctor-info"> {/* */}
                       {doctorSettings.doctorName} {/* */}
                       {doctorSettings.crm && ` - ${doctorSettings.crm}`} {/* */}
                       {doctorSettings.phone && ` - ${doctorSettings.phone}`} {/* */}
                     </div> {/* */}
                     {doctorSettings.address && ( //
                       <div className="doctor-address">{doctorSettings.address}</div> //
                     )}
                     {doctorSettings.logo && ( //
                       <div className="logo-container"> {/* */}
                         <img src={doctorSettings.logo} alt="Logo/Carimbo" /> {/* */}
                       </div> //
                     )}
                   </> //
                 ) : ( //
                   <div style={{marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold'}}> {/* */}
                     CARIMBO COM NOME DO MÉDICO E CRM + TELEFONE + ASSINATURA OU QR-CODE {/* */}
                     <div style={{marginTop: '0.5rem', color: '#2563eb'}}>É OBRIGATÓRIO TAMBÉM INSERIR NOME E ENDEREÇO DA INSTITUIÇÃO OU DO CONSULTÓRIO ONDE FOI EMITIDA A RECEITA</div> {/* */}
                   </div> //
                 )}
            </PrescriptionFooter> {/* */}
          </PrescriptionDisplayContainer> {/* */}
        </ModalBody> {/* */}
        <ModalFooter> {/* */}
          <ActionButton className="success" onClick={() => generatePDF(prescriptionData)}> {/* */}
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> {/* */}
               <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/> {/* */}
               <polyline points="7 10 12 15 17 10"/> {/* */}
               <line x1="12" y1="15" x2="12" y2="3"/> {/* */}
             </svg>
             Download PDF {/* */}
          </ActionButton> {/* */}
          <ActionButton onClick={onClose}>Fechar</ActionButton> {/* */}
        </ModalFooter> {/* */}
      </ModalContent> {/* */}
    </ModalOverlay> //
  );
}