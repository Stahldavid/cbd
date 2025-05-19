import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust path if needed
import debounce from 'lodash.debounce';

const PatientSearch = ({ onPatientSelect }) => {
    const [nameQuery, setNameQuery] = useState('');
    const [rgQuery, setRgQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const performSearch = async (currentNameQuery, currentRgQuery) => {
        if (!currentNameQuery.trim() && !currentRgQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let query = supabase.from('patients').select('*');

            if (currentNameQuery.trim()) {
                // Using textSearch for FTS. The query format might need adjustment based on your exact FTS setup and needs.
                // For simple prefix matching on name, an ilike might be more straightforward initially.
                // query = query.textSearch('name', `${currentNameQuery.trim()}:*`, { type: 'websearch', config: 'portuguese' });
                query = query.ilike('name', `%${currentNameQuery.trim()}%`); // Simpler name search for now
            }

            if (currentRgQuery.trim()) {
                query = query.ilike('rg', `${currentRgQuery.trim()}%`);
            }

            const { data, error: searchError } = await query.limit(10);

            if (searchError) throw searchError;
            setSearchResults(data || []);
        } catch (err) {
            console.error('Error searching patients:', err);
            setError('Falha ao buscar pacientes. Tente novamente.');
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce the search function to avoid too many API calls
    const debouncedSearch = useCallback(debounce(performSearch, 500), []);

    useEffect(() => {
        debouncedSearch(nameQuery, rgQuery);
        // Cleanup debounce on unmount
        return () => debouncedSearch.cancel();
    }, [nameQuery, rgQuery, debouncedSearch]);

    const handleSelectPatient = (patient) => {
        onPatientSelect(patient);
        setNameQuery(''); // Clear search fields after selection
        setRgQuery('');
        setSearchResults([]);
    };

    return (
        <div className="patient-search mb-4 p-4 border rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label htmlFor="patient-name-search" className="block text-sm font-medium text-gray-700">Buscar por Nome:</label>
                    <input 
                        type="text" 
                        id="patient-name-search"
                        value={nameQuery}
                        onChange={(e) => setNameQuery(e.target.value)}
                        placeholder="Digite o nome do paciente..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="patient-rg-search" className="block text-sm font-medium text-gray-700">Buscar por RG:</label>
                    <input 
                        type="text" 
                        id="patient-rg-search"
                        value={rgQuery}
                        onChange={(e) => setRgQuery(e.target.value)}
                        placeholder="Digite o RG do paciente..."
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>

            {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {searchResults.length > 0 && (
                <ul className="mt-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                    {searchResults.map(patient => (
                        <li 
                            key={patient.id} 
                            onClick={() => handleSelectPatient(patient)} 
                            className="p-3 hover:bg-gray-100 cursor-pointer"
                        >
                            {patient.name} (RG: {patient.rg || 'N/A'})
                        </li>
                    ))}
                </ul>
            )}
            {searchResults.length === 0 && !isLoading && (nameQuery.trim() || rgQuery.trim()) && (
                 <p className="text-sm text-gray-500">Nenhum paciente encontrado.</p>
            )}
        </div>
    );
};

export default PatientSearch; 