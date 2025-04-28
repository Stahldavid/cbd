// SettingsModal.js - Modal de configurações do médico

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ActionButton } from './ChatSection';

// --- Modal Components ---
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.modalOverlay};
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.colors.modalBackground};
  border-radius: 8px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.shadows.main};
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: ${props => props.theme.colors.lightText};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  color: ${props => props.theme.colors.lightText};
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
`;

// --- Settings Form Components ---
const SettingsPanel = styled.div`
  background-color: ${props => props.theme.colors.messageBg}; 
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px; 
  padding: 1rem 1.5rem; 
  margin-bottom: 1.5rem; 
  box-shadow: ${props => props.theme.shadows.main};
  
  h3 { 
    margin-top: 0; 
    margin-bottom: 1rem; 
    font-size: 1.1rem; 
    font-weight: 600; 
    color: ${props => props.theme.colors.primary}; 
  }
`;

const FormGroup = styled.div`
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 1rem; 
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block; 
  margin-bottom: 0.25rem; 
  font-size: 0.875rem; 
  font-weight: 500; 
  color: ${props => props.theme.colors.prescriptionLabel};
`;

const FormInput = styled.input`
  width: 100%; 
  padding: 0.5rem 0.75rem; 
  border: 1px solid ${props => props.theme.colors.prescriptionBorder};
  border-radius: 4px; 
  font-size: 0.95rem; 
  background-color: ${props => props.theme.colors.background}; 
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s ease-in-out;
  
  &:focus { 
    outline: none; 
    border-color: ${props => props.theme.colors.primary}; 
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); 
  }
`;

const FormTextarea = styled.textarea`
  width: 100%; 
  padding: 0.5rem 0.75rem; 
  border: 1px solid ${props => props.theme.colors.prescriptionBorder};
  border-radius: 4px; 
  font-size: 0.95rem; 
  background-color: ${props => props.theme.colors.background}; 
  color: ${props => props.theme.colors.text};
  transition: border-color 0.2s ease-in-out;
  min-height: 80px;
  resize: vertical;
  
  &:focus { 
    outline: none; 
    border-color: ${props => props.theme.colors.primary}; 
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); 
  }
`;

const LogoUploadArea = styled.div`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
  
  input {
    display: none;
  }
  
  p {
    margin: 0;
    color: ${props => props.theme.colors.lightText};
    font-size: 0.9rem;
  }
  
  svg {
    margin-bottom: 0.5rem;
    color: ${props => props.theme.colors.lightText};
  }
`;

const LogoPreview = styled.div`
  margin-top: 1rem;
  text-align: center;
  
  img {
    max-width: 100%;
    max-height: 100px;
    border-radius: 4px;
  }
`;

const SuccessMessage = styled.div`
  background-color: ${props => props.theme.colors.success}20;
  color: ${props => props.theme.colors.success};
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  svg {
    flex-shrink: 0;
  }
`;

// Componente do Modal de Configurações
export function SettingsModal({ 
  isOpen, 
  onClose, 
  doctorSettings,
  setDoctorSettings
}) {
  const [formData, setFormData] = useState({...doctorSettings});
  const [logoPreview, setLogoPreview] = useState(doctorSettings.logo || '');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Atualiza o formulário quando as configurações mudam
  useEffect(() => {
    setFormData({...doctorSettings});
    setLogoPreview(doctorSettings.logo || '');
  }, [doctorSettings, isOpen]);
  
  // Manipulador para mudança nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manipulador para upload do logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          logo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Manipulador para salvar configurações
  const handleSave = () => {
    // Atualiza as configurações no estado do app
    setDoctorSettings(formData);
    
    // Salva no localStorage
    localStorage.setItem('curaAIDoctorSettings', JSON.stringify(formData));
    
    // Exibe mensagem de sucesso
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  return (
    <ModalOverlay isOpen={isOpen}>
      <ModalContent>
        <ModalHeader>
          <h2>Configurações do Médico</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          {showSuccess && (
            <SuccessMessage>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Configurações salvas com sucesso!
            </SuccessMessage>
          )}
          
          <SettingsPanel>
            <h3>Informações Profissionais</h3>
            <FormGroup>
              <div>
                <FormLabel htmlFor="doctorName">Nome do Médico</FormLabel>
                <FormInput 
                  type="text" 
                  id="doctorName" 
                  name="doctorName" 
                  value={formData.doctorName || ''} 
                  onChange={handleChange} 
                  placeholder="Dr. Nome Completo"
                />
              </div>
              <div>
                <FormLabel htmlFor="crm">CRM</FormLabel>
                <FormInput 
                  type="text" 
                  id="crm" 
                  name="crm" 
                  value={formData.crm || ''} 
                  onChange={handleChange}
                  placeholder="CRM/UF 12345" 
                />
              </div>
              <div>
                <FormLabel htmlFor="phone">Telefone</FormLabel>
                <FormInput 
                  type="text" 
                  id="phone" 
                  name="phone" 
                  value={formData.phone || ''} 
                  onChange={handleChange}
                  placeholder="(00) 00000-0000" 
                />
              </div>
            </FormGroup>
            
            <div>
              <FormLabel htmlFor="address">Endereço do Consultório</FormLabel>
              <FormTextarea 
                id="address" 
                name="address" 
                value={formData.address || ''} 
                onChange={handleChange}
                placeholder="Rua, número, bairro, cidade - UF, CEP" 
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <FormLabel>Logo ou Carimbo</FormLabel>
              <LogoUploadArea onClick={() => document.getElementById('logoUpload').click()}>
                <input 
                  type="file" 
                  id="logoUpload" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Clique para fazer upload de uma imagem</p>
              </LogoUploadArea>
              
              {logoPreview && (
                <LogoPreview>
                  <img src={logoPreview} alt="Logo Preview" />
                </LogoPreview>
              )}
            </div>
          </SettingsPanel>
        </ModalBody>
        <ModalFooter>
          <ActionButton className="success" onClick={handleSave}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Salvar
          </ActionButton>
          <ActionButton onClick={onClose}>Cancelar</ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}