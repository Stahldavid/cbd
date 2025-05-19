import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient'; 
import { ActionButton } from '../ChatSection';

// Re-using some styled components from a common source or redefining if specific
// For simplicity, I might redefine some similar to PrescriptionModal, but ideally, these would be common
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
  z-index: 1050; // Higher than PatientContextBar or other elements
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.colors.modalBackground};
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.main};
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  h2 {
    font-size: 1.25rem;
    margin: 0;
    color: ${(props) => props.theme.colors.lightText};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const CloseButton = styled.button`
  border: none;
  background: none;
  color: ${(props) => props.theme.colors.lightText};
  cursor: pointer;
  font-size: 1.25rem;
  // ... other styles from PrescriptionModal ...
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme.colors.prescriptionLabel};
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.colors.prescriptionBorder};
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  // ... other styles from PrescriptionModal ...
`;

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.colors.errorText};
  background-color: ${(props) => props.theme.colors.errorBg};
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
`;

const initialPatientState = {
  name: '',
  rg: '',
  cpf: '', // Assuming you have CPF
  date_of_birth: '',
  phone_number: '',
  email: '',
  address: '',
  gender: '', // e.g., 'Masculino', 'Feminino', 'Outro'
  medical_history_summary: '' // Optional summary
};

export function AddPatientModal({ isOpen, onClose, onPatientAdded }) {
  const [patientData, setPatientData] = useState(initialPatientState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPatientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic Validation (can be expanded)
    if (!patientData.name || !patientData.rg || !patientData.date_of_birth) {
      setError('Nome, RG e Data de Nascimento são obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('patients')
        .insert([{
          ...patientData,
          // Ensure date_of_birth is in YYYY-MM-DD for Supabase
          date_of_birth: patientData.date_of_birth ? new Date(patientData.date_of_birth).toISOString().split('T')[0] : null,
        }])
        .select(); // Important to get the inserted data back

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        onPatientAdded(data[0]); // Pass the newly created patient back
        setPatientData(initialPatientState); // Reset form
        onClose(); // Close modal on success
      } else {
        throw new Error("Não foi possível obter os dados do paciente após a inserção.");
      }

    } catch (err) {
      console.error("Error adding patient:", err);
      setError(err.message || 'Falha ao adicionar paciente. Verifique os campos e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Adicionar Novo Paciente</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <InputGroup>
              <Label htmlFor="name">Nome Completo*</Label>
              <InputField type="text" id="name" name="name" value={patientData.name} onChange={handleChange} required />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="rg">RG*</Label>
              <InputField type="text" id="rg" name="rg" value={patientData.rg} onChange={handleChange} required />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="cpf">CPF</Label>
              <InputField type="text" id="cpf" name="cpf" value={patientData.cpf} onChange={handleChange} />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="date_of_birth">Data de Nascimento*</Label>
              <InputField type="date" id="date_of_birth" name="date_of_birth" value={patientData.date_of_birth} onChange={handleChange} required />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="phone_number">Telefone</Label>
              <InputField type="tel" id="phone_number" name="phone_number" value={patientData.phone_number} onChange={handleChange} />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="email">Email</Label>
              <InputField type="email" id="email" name="email" value={patientData.email} onChange={handleChange} />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="address">Endereço</Label>
              <InputField type="text" id="address" name="address" value={patientData.address} onChange={handleChange} />
            </InputGroup>
            <InputGroup>
              <Label htmlFor="gender">Gênero</Label>
              <InputField as="select" id="gender" name="gender" value={patientData.gender} onChange={handleChange}>
                  <option value="">Selecione...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Prefiro não informar">Prefiro não informar</option>
              </InputField>
            </InputGroup>
             {/* medical_history_summary is probably not for initial creation by doctor, but can be added if needed */}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </ModalBody>
          <ModalFooter>
            <ActionButton type="button" onClick={onClose} disabled={isLoading} style={{ backgroundColor: '#6c757d' }}>
              Cancelar
            </ActionButton>
            <ActionButton type="submit" disabled={isLoading} style={{ backgroundColor: isLoading ? '#ccc' : '#28a745' }}>
              {isLoading ? 'Salvando...' : 'Salvar Paciente'}
            </ActionButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
} 