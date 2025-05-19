import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../supabaseClient';
import debounce from 'lodash.debounce';
import { ActionButton } from '../ChatSection'; // Assuming ChatSection.js is in parent directory

// Styled components (can be shared from a common file or AddPatientModal/PrescriptionModal)
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${(props) => props.theme.colors.modalOverlay};
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center; align-items: center; z-index: 1050; padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.colors.modalBackground};
  border-radius: 8px; max-width: 600px; width: 100%;
  max-height: 90vh; overflow-y: auto; box-shadow: ${(props) => props.theme.shadows.main};
  display: flex; flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 1.5rem; border-bottom: 1px solid ${(props) => props.theme.colors.border};
  h2 { font-size: 1.25rem; margin: 0; color: ${(props) => props.theme.colors.lightText}; }
`;

const ModalBody = styled.div`
  padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;
`;

const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 1rem;
  padding: 1rem 1.5rem; border-top: 1px solid ${(props) => props.theme.colors.border};
`;

const CloseButton = styled.button`
  border: none; background: none; color: ${(props) => props.theme.colors.lightText};
  cursor: pointer; font-size: 1.25rem;
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.5rem; position: relative; // For search results dropdown
`;

const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; color: ${(props) => props.theme.colors.prescriptionLabel};
`;

const InputField = styled.input`
  width: 100%; padding: 0.5rem 0.75rem; border: 1px solid ${(props) => props.theme.colors.prescriptionBorder};
  border-radius: 4px; font-size: 0.95rem; background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
`;

const SearchResultsDropdown = styled.ul`
  list-style-type: none; margin: 0; padding: 0; position: absolute; top: 100%; left: 0; right: 0;
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border}; border-top: none;
  border-radius: 0 0 4px 4px; max-height: 200px; overflow-y: auto; z-index: 100;
  box-shadow: ${(props) => props.theme.shadows.main};
`;

const SearchResultItem = styled.li`
  padding: 0.75rem; cursor: pointer; color: ${(props) => props.theme.colors.text};
  font-size: 0.9rem;
  &:hover {
    background-color: ${(props) => props.theme.colors.primary};
    color: ${(props) => props.theme.colors.lightText};
  }
  .rg-display { font-size: 0.8rem; color: ${(props) => props.theme.colors.prescriptionLabel}; margin-left: 0.5rem; }
  &:hover .rg-display { color: ${(props) => props.theme.colors.lightText}; }
`;

const ErrorMessage = styled.p`
  color: ${(props) => props.theme.colors.errorText}; background-color: ${(props) => props.theme.colors.errorBg};
  padding: 0.5rem; border-radius: 4px; font-size: 0.85rem; margin-top: 0.5rem;
`;

export function SelectPatientModal({ isOpen, onClose, onPatientSelected }) {
  const [searchName, setSearchName] = useState('');
  const [searchRg, setSearchRg] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSearchField, setActiveSearchField] = useState(null);

  const performSearch = async (name, rg) => {
    if (!name.trim() && !rg.trim()) {
      setSearchResults([]);
      setActiveSearchField(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('patients').select('*');
      if (name.trim()) {
        query = query.ilike('name', `%${name.trim()}%`);
        setActiveSearchField('name');
      } else if (rg.trim()) {
        query = query.ilike('rg', `${rg.trim()}%`);
        setActiveSearchField('rg');
      }
      const { data, error: searchError } = await query.limit(10);
      if (searchError) throw searchError;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching patients:', err);
      setError('Falha ao buscar pacientes.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 400), []);

  useEffect(() => {
    if (searchName.length > 1 || searchRg.length > 1) {
      debouncedSearch(searchName, searchRg);
    } else {
      setSearchResults([]);
      setActiveSearchField(null);
    }
    return () => debouncedSearch.cancel();
  }, [searchName, searchRg, debouncedSearch]);

  const handleSelectPatient = (patient) => {
    onPatientSelected(patient);
    setSearchName('');
    setSearchRg('');
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Selecionar Paciente Existente</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <InputGroup>
            <Label htmlFor="searchName">Buscar por Nome:</Label>
            <InputField
              type="text"
              id="searchName"
              value={searchName}
              onChange={(e) => { setSearchName(e.target.value); setSearchRg(''); }}
              placeholder="Digite o nome do paciente..."
              autoFocus
            />
            {activeSearchField === 'name' && searchResults.length > 0 && (
              <SearchResultsDropdown>
                {searchResults.map((p) => (
                  <SearchResultItem key={p.id} onClick={() => handleSelectPatient(p)}>
                    {p.name} <span className="rg-display">(RG: {p.rg || 'N/A'})</span>
                  </SearchResultItem>
                ))}
              </SearchResultsDropdown>
            )}
          </InputGroup>

          <InputGroup>
            <Label htmlFor="searchRg">Buscar por RG:</Label>
            <InputField
              type="text"
              id="searchRg"
              value={searchRg}
              onChange={(e) => { setSearchRg(e.target.value); setSearchName(''); }}
              placeholder="Digite o RG do paciente..."
            />
            {activeSearchField === 'rg' && searchResults.length > 0 && (
              <SearchResultsDropdown>
                {searchResults.map((p) => (
                  <SearchResultItem key={p.id} onClick={() => handleSelectPatient(p)}>
                    {p.name} <span className="rg-display">(RG: {p.rg || 'N/A'})</span>
                  </SearchResultItem>
                ))}
              </SearchResultsDropdown>
            )}
          </InputGroup>
          
          {isLoading && <p>Buscando...</p>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {!isLoading && !error && searchResults.length === 0 && (searchName.length > 1 || searchRg.length > 1) && (
            <p>Nenhum paciente encontrado com os critérios informados.</p>
          )}
        </ModalBody>
        <ModalFooter>
          <ActionButton type="button" onClick={onClose} style={{ backgroundColor: '#6c757d' }}>
            Cancelar
          </ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
} 