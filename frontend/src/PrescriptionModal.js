// PrescriptionModal.js - Modal do receituário com função de download

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { ActionButton } from './ChatSection'; //
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from './supabaseClient'; // Assuming supabaseClient is in src/
import debounce from 'lodash.debounce'; // Make sure lodash is installed

// --- Modal Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) => props.theme.colors.modalOverlay};
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`; //

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.colors.modalBackground}; //
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.main}; //
  display: flex;
  flex-direction: column;
`; //

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border}; //

  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: ${(props) => props.theme.colors.lightText}; //
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
  border-top: 1px solid ${(props) => props.theme.colors.border}; //
`; //

const CloseButton = styled.button`
  border: none;
  background: none;
  color: ${(props) => props.theme.colors.lightText}; //
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
  background-color: ${(props) => props.theme.colors.messageBg}; //
  border: 1px solid ${(props) => props.theme.colors.border}; //
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: ${(props) => props.theme.shadows.main}; //

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary}; //
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
  color: ${(props) => props.theme.colors.prescriptionLabel}; //
`; //

const PatientInputField = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.prescriptionBorder}; //
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${(props) => props.theme.colors.background}; //
  color: ${(props) => props.theme.colors.text}; //
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary}; //
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`; //

const PrescriptionTextareaField = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.prescriptionBorder}; //
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${(props) => (props.readOnly ? props.theme.colors.border : props.theme.colors.background)}; // Change background if readOnly
  color: ${(props) => (props.readOnly ? props.theme.colors.prescriptionLabel : props.theme.colors.text)}; // Change text color if readOnly
  transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out; // Added transitions
  min-height: 60px;
  resize: vertical;
  cursor: ${(props) => (props.readOnly ? 'default' : 'text')}; // Change cursor if readOnly

  &:focus {
    ${(props) => !props.readOnly && `
    outline: none;
      border-color: ${props.theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    `}
  }
`; //

// --- Prescription Display Components ---
const PrescriptionDisplayContainer = styled.div`
  border: 1px dashed ${(props) => props.theme.colors.prescriptionBorder}; //
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  background-color: ${(props) => props.theme.colors.messageBg}; //

  h2 {
    text-align: center;
    font-size: 1.25rem;
    margin-top: 0;
    margin-bottom: 0.25rem;
  }

  p.subtitle {
    text-align: center;
    font-size: 0.9rem;
    color: ${(props) => props.theme.colors.prescriptionLabel}; //
    margin-bottom: 1.5rem;
  }
`; //

const PrescriptionSection = styled.div`
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border}; //

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: ${(props) => props.theme.colors.primary}; //
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
  color: ${(props) => props.theme.colors.prescriptionLabel}; //
  margin-right: 0.5rem;
  font-weight: 500;
  min-width: 120px;
`; //

const PrescriptionValue = styled.span`
  font-size: 0.95rem;
  color: ${(props) => props.theme.colors.text}; //
  white-space: pre-wrap;
  word-break: break-word;
`; //

const PrescriptionFooter = styled.div`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: ${(props) => props.theme.colors.prescriptionLabel}; //

  .signature-line {
    display: block;
    margin-top: 3rem;
    margin-bottom: 0.5rem;
    border-top: 1px solid ${(props) => props.theme.colors.text}; //
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

// --- Styled Components for Search Dropdown ---
const SearchResultsDropdown = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
  position: absolute;
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-top: none;
  border-radius: 0 0 4px 4px;
  width: calc(100% - 2px); // Match input field width considering border
  max-height: 150px;
  overflow-y: auto;
  z-index: 1001; // Above modal content but can be adjusted
  box-shadow: ${(props) => props.theme.shadows.main};
`;

const SearchResultItem = styled.li`
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: ${(props) => props.theme.colors.text};
  font-size: 0.9rem;

  &:hover {
    background-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.lightText}; // Ensure text is visible on hover
  }

  // Style for the RG part of the text to be less prominent if needed
  .rg-display {
    font-size: 0.8rem;
    color: ${(props) => props.theme.colors.prescriptionLabel};
    margin-left: 0.5rem;
  }

  &:hover .rg-display {
    color: ${(props) => props.theme.colors.lightText}; // Match hover text color
  }
`;
// --- End Styled Components for Search Dropdown ---

// Função para gerar o PDF (sem alterações necessárias aqui)
const generatePDF = (prescriptionData) => {
  //
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
  labels.forEach((label) => {
    originalStyles.push({ element: label, color: label.style.color });
    label.style.color = '#4b5563';
  }); //
  values.forEach((value) => {
    originalStyles.push({ element: value, color: value.style.color });
    value.style.color = '#111827';
  }); //
  headings.forEach((heading) => {
    originalStyles.push({ element: heading, color: heading.style.color });
    heading.style.color = '#2563eb';
  }); //
  if (subtitle) {
    originalStyles.push({ element: subtitle, color: subtitle.style.color });
    subtitle.style.color = '#6b7280';
  } //

  html2canvas(prescriptionElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  }) //
    .then((canvas) => {
      //
      const imgData = canvas.toDataURL('image/png'); //
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }); //
      const imgWidth = 210; //
      const pageHeight = 297; //
      const imgHeight = (canvas.height * imgWidth) / canvas.width; //
      let heightLeft = imgHeight; //
      let position = 0; //
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); //
      heightLeft -= pageHeight; //
      while (heightLeft >= 0) {
        //
        position = heightLeft - imgHeight; //
        pdf.addPage(); //
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); //
        heightLeft -= pageHeight; //
      }
      const fileName = prescriptionData.patientName
        ? `receituario_${prescriptionData.patientName.replace(/\s+/g, '_')}.pdf`
        : 'receituario_medico.pdf'; //
      pdf.save(fileName); //
      prescriptionElement.style.backgroundColor = originalBg; //
      prescriptionElement.style.color = originalColor; //
      originalStyles.forEach((item) => {
        item.element.style.color = item.color;
      }); //
    });
};

// Componente do Modal de Receituário
export function PrescriptionModal({
  isOpen,
  onClose,
  prescriptionData,
  handlePrescriptionChange,
  doctorSettings,
  activePatient,
}) {
  const prescriptionRef = useRef();

  // State for integrated search - will be less used if activePatient is present
  const [searchNameInput, setSearchNameInput] = useState(''); 
  const [searchRgInput, setSearchRgInput] = useState('');   
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [activeSearchField, setActiveSearchField] = useState(null); 

  // Populate form with activePatient data when modal opens or activePatient changes
  useEffect(() => {
    if (activePatient) {
      handlePrescriptionChange({ target: { name: 'patientName', value: activePatient.name || '' } });
      handlePrescriptionChange({ target: { name: 'patientDOB', value: activePatient.date_of_birth || '' } });
      handlePrescriptionChange({ target: { name: 'patientAge', value: activePatient.date_of_birth ? calculateAge(activePatient.date_of_birth) : ''} });
      handlePrescriptionChange({ target: { name: 'patientRG', value: activePatient.rg || '' } });
      handlePrescriptionChange({ target: { name: 'patientAddress', value: activePatient.address || '' } });
      // Clear any lingering search states if we have an active patient
      setSearchNameInput('');
      setSearchRgInput('');
      setSearchResults([]);
      setActiveSearchField(null);
    }
    // If no activePatient, form fields will use prescriptionData as before (though this path is less likely now)
  }, [activePatient, isOpen, handlePrescriptionChange]); // Rerun if modal opens or patient changes

  // Debounced search function - Keep for now, but UI for it will be conditional
  const performSearch = async (name, rg) => {
    if (!name.trim() && !rg.trim()) {
      setSearchResults([]);
      setActiveSearchField(null);
      return;
    }
    setIsSearchLoading(true);
    setSearchError(null);
    try {
      let query = supabase.from('patients').select('*');
      if (name.trim()) {
        query = query.ilike('name', `%${name.trim()}%`);
        setActiveSearchField('name');
      } else if (rg.trim()) {
        query = query.ilike('rg', `${rg.trim()}%`);
        setActiveSearchField('rg');
      }
      const { data, error } = await query.limit(5);
      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching patients:', err);
      setSearchError('Falha ao buscar pacientes.');
      setSearchResults([]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 400), []);

  useEffect(() => {
    if (searchNameInput.length > 1 || searchRgInput.length > 1) {
      debouncedSearch(searchNameInput, searchRgInput);
    } else {
      setSearchResults([]); // Clear results if query is too short
      setActiveSearchField(null);
    }
    return () => debouncedSearch.cancel();
  }, [searchNameInput, searchRgInput, debouncedSearch]);

  const handleNameInputChange = (e) => {
    const value = e.target.value;
    // Only allow changing searchNameInput if no activePatient (fallback, less likely)
    if (!activePatient) {
        setSearchNameInput(value);
        setSearchRgInput(''); 
        handlePrescriptionChange({ target: { name: 'patientName', value } }); 
    }
  };

  const handleRgInputChange = (e) => {
    const value = e.target.value;
    if (!activePatient) {
        setSearchRgInput(value);
        setSearchNameInput(''); 
        handlePrescriptionChange({ target: { name: 'patientRG', value } }); 
    }
  };

  const handleSelectPatientFromDropdown = (selectedPatient) => {
    // This function is less likely to be called if activePatient is already set
    // but kept for potential fallback or if modal is used differently in future.
    if (selectedPatient) {
      handlePrescriptionChange({ target: { name: 'patientName', value: selectedPatient.name || '' } });
      handlePrescriptionChange({ target: { name: 'patientDOB', value: selectedPatient.date_of_birth || '' } });
      handlePrescriptionChange({ target: { name: 'patientAge', value: selectedPatient.date_of_birth ? calculateAge(selectedPatient.date_of_birth) : ''} });
      handlePrescriptionChange({ target: { name: 'patientRG', value: selectedPatient.rg || '' } });
      handlePrescriptionChange({ target: { name: 'patientAddress', value: selectedPatient.address || '' } });
      // Add/update other fields from selectedPatient into prescriptionData as needed
      // e.g., CPF, gender, phone_number, email from selectedPatient.cpf, selectedPatient.gender etc.
      // if those fields exist in your prescriptionData state and patient table.
      // handlePrescriptionChange({ target: { name: 'patientCPF', value: selectedPatient.cpf || '' } });

      setSearchResults([]);
      setSearchNameInput(selectedPatient.name || ''); // Keep selected name in input
      setSearchRgInput(selectedPatient.rg || '');   // Keep selected RG in input
      setActiveSearchField(null);
      console.log("Patient selected and form populated:", selectedPatient);
    }
  };
  
  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? `${age} anos` : '';
  };

  const handleDownload = () => {
    // A lógica de download permanece a mesma
    generatePDF(prescriptionData, doctorSettings); // Passar doctorSettings
  };

  if (!isOpen) return null;

  const searchResultsBoxStyle = {
    position: 'absolute',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '4px',
    zIndex: 100,
    maxHeight: '150px',
    overflowY: 'auto',
    width: 'calc(100% - 2px)', // Adjust based on input padding/border
    marginTop: '1px'
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Receituário Médico</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <PrescriptionPanel>
            <h3>Informações do Paciente</h3>
            <PatientInputGroup>
              <div style={{ position: 'relative' }}> 
                <PatientInputLabel htmlFor="patientName">Nome do Paciente:</PatientInputLabel>
                <PatientInputField
                  type="text"
                  id="patientName"
                  name="patientName"
                  autoComplete="off"
                  value={prescriptionData.patientName || ''} // Always from prescriptionData, which is now populated by activePatient
                  onChange={handleNameInputChange} // Will be no-op if activePatient exists
                  readOnly={!!activePatient} // Make read-only if patient selected
                  onFocus={() => { if(!activePatient) { setSearchRgInput(''); setActiveSearchField('name'); } }} 
                />
                {!activePatient && activeSearchField === 'name' && searchResults.length > 0 && (
                  <SearchResultsDropdown role="listbox">
                    {searchResults.map((patient) => (
                      <SearchResultItem
                        key={patient.id}
                        role="option"
                        onClick={() => handleSelectPatientFromDropdown(patient)}
                      >
                        {patient.name} <span className="rg-display">(RG: {patient.rg || 'N/A'})</span>
                      </SearchResultItem>
                    ))}
                  </SearchResultsDropdown>
                )}
                {!activePatient && activeSearchField === 'name' && isSearchLoading && <small style={{display: 'block', marginTop: '4px'}}>Buscando...</small>}
              </div>

              <div style={{ position: 'relative' }}> 
                <PatientInputLabel htmlFor="patientRG">RG do Paciente:</PatientInputLabel>
                <PatientInputField
                  type="text"
                  id="patientRG"
                  name="patientRG"
                  autoComplete="off"
                  value={prescriptionData.patientRG || ''} 
                  onChange={handleRgInputChange} // Will be no-op if activePatient exists
                  readOnly={!!activePatient} // Make read-only if patient selected
                  onFocus={() => { if(!activePatient) { setSearchNameInput(''); setActiveSearchField('rg');} }}
                />
                {!activePatient && activeSearchField === 'rg' && searchResults.length > 0 && (
                  <SearchResultsDropdown role="listbox">
                    {searchResults.map((patient) => (
                      <SearchResultItem
                        key={patient.id}
                        role="option"
                        onClick={() => handleSelectPatientFromDropdown(patient)}
                      >
                        {patient.name} <span className="rg-display">(RG: {patient.rg || 'N/A'})</span>
                      </SearchResultItem>
                    ))}
                  </SearchResultsDropdown>
                )}
                 {!activePatient && activeSearchField === 'rg' && isSearchLoading && <small style={{display: 'block', marginTop: '4px'}}>Buscando...</small>}
              </div>
              
              <div>
                <PatientInputLabel htmlFor="patientDOB">Data de Nascimento:</PatientInputLabel>
                <PatientInputField
                  type="date"
                  id="patientDOB"
                  name="patientDOB"
                    value={prescriptionData.patientDOB || ''} 
                  onChange={handlePrescriptionChange}
                    readOnly={!!activePatient} // Make read-only if patient selected
                />
              </div>
              <div>
                <PatientInputLabel htmlFor="patientAge">Idade:</PatientInputLabel>
                <PatientInputField
                    type="text" 
                  id="patientAge"
                  name="patientAge"
                    value={prescriptionData.patientAge || ''} 
                    onChange={handlePrescriptionChange} 
                    placeholder="Ex: 30 anos"
                    readOnly // Age is calculated
                />
              </div>
               <div>
                <PatientInputLabel htmlFor="patientAddress">Endereço do Paciente (opcional):</PatientInputLabel>
                <PatientInputField 
                    type="text" 
                    id="patientAddress" 
                    name="patientAddress" 
                    value={prescriptionData.patientAddress || ''} 
                  onChange={handlePrescriptionChange}
                    readOnly={!!activePatient} // Make read-only if patient selected
                />
              </div>
            </PatientInputGroup>
          </PrescriptionPanel>

          <PrescriptionPanel>
            <h3>Detalhes da Prescrição</h3>
            <div>
                <PatientInputLabel htmlFor="productInfo">Produto Prescrito (Nome, Concentração, Forma Farmacêutica):</PatientInputLabel>
                <PrescriptionTextareaField 
                    id="productInfo" 
                    name="productInfo" 
                    value={prescriptionData.productInfo || ''} 
                    onChange={handlePrescriptionChange} 
                    rows="3"
                    readOnly
                />
            </div>
            <PatientInputGroup>
                <div>
                    <PatientInputLabel htmlFor="usageType">Tipo de Uso:</PatientInputLabel>
                    <PatientInputField 
                        as="select" 
                        id="usageType" 
                        name="usageType" 
                        value={prescriptionData.usageType || 'USO ORAL'} 
                        onChange={handlePrescriptionChange}
                    >
                        <option value="USO ORAL">USO ORAL</option>
                        <option value="USO TÓPICO">USO TÓPICO</option>
                        <option value="USO SUBLINGUAL">USO SUBLINGUAL</option>
                        <option value="USO INALATÓRIO">USO INALATÓRIO</option>
                        <option value="OUTRO">OUTRO (especificar)</option>
                    </PatientInputField>
                </div>
                 <div>
                    <PatientInputLabel htmlFor="isContinuousUse" style={{ display: 'flex', alignItems: 'center' }}>
                        <PatientInputField 
                            type="checkbox" 
                            id="isContinuousUse" 
                            name="isContinuousUse" 
                            checked={prescriptionData.isContinuousUse || false} 
                            onChange={handlePrescriptionChange} 
                            style={{ width: 'auto', marginRight: '0.5rem' }}
                        />
                        Uso Contínuo
              </PatientInputLabel>
                </div>
            </PatientInputGroup>
             <div>
                <PatientInputLabel htmlFor="dosageInstruction">Posologia (Instruções de Uso):</PatientInputLabel>
              <PrescriptionTextareaField
                id="dosageInstruction"
                name="dosageInstruction"
                value={prescriptionData.dosageInstruction || ''}
                onChange={handlePrescriptionChange}
                rows="3"
              />
            </div>
             <div>
                <PatientInputLabel htmlFor="justification">Justificativa Médica (opcional):</PatientInputLabel>
                <PrescriptionTextareaField 
                    id="justification" 
                    name="justification" 
                    value={prescriptionData.justification || ''} 
                onChange={handlePrescriptionChange}
                    rows="2"
                    readOnly
              />
            </div>
          </PrescriptionPanel>

          <PrescriptionDisplayContainer ref={prescriptionRef}>
            <h2>RECEITUÁRIO MÉDICO</h2>
            <p className="subtitle">(Receita médica simples branca)</p>
            <PrescriptionSection>
              <h4>Paciente</h4>
              <PrescriptionField>
                <PrescriptionLabel>Nome:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.patientName || '____________________'}</PrescriptionValue>
              </PrescriptionField>
              <PrescriptionField>
                <PrescriptionLabel>RG:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.patientRG || '____________________'}</PrescriptionValue>
              </PrescriptionField>
              <PrescriptionField>
                <PrescriptionLabel>Data de Nasc.:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.patientDOB ? new Date(prescriptionData.patientDOB + 'T00:00:00').toLocaleDateString('pt-BR') : '____/____/____'}</PrescriptionValue>
              </PrescriptionField>
              <PrescriptionField>
                <PrescriptionLabel>Idade:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.patientAge || '____________________'}</PrescriptionValue>
              </PrescriptionField>
              {prescriptionData.patientAddress && (
                <PrescriptionField>
                    <PrescriptionLabel>Endereço:</PrescriptionLabel>
                    <PrescriptionValue>{prescriptionData.patientAddress}</PrescriptionValue>
                </PrescriptionField>
              )}
              </PrescriptionSection>

            <PrescriptionSection>
              <h4>Prescrição</h4>
              <PrescriptionField>
                <PrescriptionLabel>Produto:</PrescriptionLabel>
                <PrescriptionValue style={{ fontWeight: 'bold' }}>{prescriptionData.productInfo || '____________________'}</PrescriptionValue>
              </PrescriptionField>
              <PrescriptionField>
                <PrescriptionLabel>Tipo de Uso:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.usageType || 'USO ORAL'}{prescriptionData.isContinuousUse ? ' (Uso Contínuo)' : ''}</PrescriptionValue>
              </PrescriptionField>
              <PrescriptionField>
                <PrescriptionLabel>Posologia:</PrescriptionLabel>
                <PrescriptionValue>{prescriptionData.dosageInstruction || '____________________'}</PrescriptionValue>
              </PrescriptionField>
              {prescriptionData.justification && (
                <PrescriptionField>
                    <PrescriptionLabel>Justificativa:</PrescriptionLabel>
                    <PrescriptionValue>{prescriptionData.justification}</PrescriptionValue>
                </PrescriptionField>
              )}
            </PrescriptionSection>

            <PrescriptionFooter>
                 <p>Data de Emissão: {prescriptionData.emissionDate || new Date().toLocaleDateString('pt-BR')}</p>
              <div className="signature-line"></div>
                <p className="doctor-info">
                    {doctorSettings?.logo && 
                        <img src={doctorSettings.logo} alt="Logo do Médico" style={{ maxHeight: '80px', maxWidth: '200px' }} />
                    }
                    {doctorSettings?.doctorName || 'Nome do Médico'}<br />
                    CRM: {doctorSettings?.crm || '00000'}
                </p>
                {(doctorSettings?.address || doctorSettings?.phone) && (
                    <p className="doctor-address">
                        {doctorSettings.address}{doctorSettings.address && doctorSettings.phone ? ' - ' : ''}{doctorSettings.phone}
                    </p>
              )}
            </PrescriptionFooter>
          </PrescriptionDisplayContainer>

        </ModalBody>
        <ModalFooter>
          <ActionButton onClick={handleDownload} style={{ backgroundColor: '#28a745' }}>
            Baixar Receituário (PDF)
          </ActionButton>
          <ActionButton onClick={onClose} style={{ backgroundColor: '#6c757d' }}>
            Fechar
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
