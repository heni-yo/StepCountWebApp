import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { searchPatient, configureAccelerometer } from '../services/patientApi';

const PatientConfig = ({ onPatientFound, onAccelerometerConfigured, currentPatient, accelerometerId }) => {
  const [patientId, setPatientId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const handleSearchPatient = async () => {
    if (!patientId.trim()) {
      toast.error('Veuillez saisir un ID patient');
      return;
    }

    console.log('Recherche du patient:', patientId);
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Convertir en majuscules pour correspondre à l'API
      const patientIdUpper = patientId.trim().toUpperCase();
      console.log('ID patient converti:', patientIdUpper);
      
      const patient = await searchPatient(patientIdUpper);
      console.log('Patient trouvé:', patient);
      
      onPatientFound(patient);
      toast.success('Patient trouvé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSearchError(`Patient non trouvé: ${patientId.toUpperCase()}`);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfigureAccelerometer = async () => {
    if (!currentPatient) {
      toast.error('Veuillez d\'abord rechercher un patient');
      return;
    }

    setIsConfiguring(true);
    try {
      const accelerometerData = await configureAccelerometer(currentPatient.id);
      onAccelerometerConfigured(accelerometerData.id);
      toast.success('Accéléromètre configuré et initialisé avec succès!');
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configuration & Initialisation de l'Accéléromètre
        </h2>
        <p className="text-gray-600">
          Recherchez un patient et configurez l'accéléromètre pour commencer l'enregistrement
        </p>
      </div>

      {/* Recherche Patient */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          1. Recherche du Patient
        </h3>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Saisir l'ID du patient"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearchPatient}
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Affichage de l'erreur de recherche */}
        {searchError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {searchError}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Patients disponibles: P001, P002, P003
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Affichage des données patient */}
        {currentPatient && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Informations Patient</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Nom:</span>
                <span className="ml-2 font-medium">{currentPatient.nom}</span>
              </div>
              <div>
                <span className="text-gray-600">Prénom:</span>
                <span className="ml-2 font-medium">{currentPatient.prenom}</span>
              </div>
              <div>
                <span className="text-gray-600">Date de naissance:</span>
                <span className="ml-2 font-medium">{currentPatient.date_naissance}</span>
              </div>
              <div>
                <span className="text-gray-600">Âge:</span>
                <span className="ml-2 font-medium">{currentPatient.age} ans</span>
              </div>
              <div>
                <span className="text-gray-600">Sexe:</span>
                <span className="ml-2 font-medium">{currentPatient.sexe}</span>
              </div>
              <div>
                <span className="text-gray-600">Poids:</span>
                <span className="ml-2 font-medium">{currentPatient.poids} kg</span>
              </div>
              <div>
                <span className="text-gray-600">Taille:</span>
                <span className="ml-2 font-medium">{currentPatient.taille} cm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Accéléromètre */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          2. Configuration de l'Accéléromètre
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Une fois le patient trouvé, configurez l'accéléromètre pour commencer l'enregistrement.
            L'ID du patient sera automatiquement enregistré dans l'accéléromètre.
          </p>
          
          <button
            onClick={handleConfigureAccelerometer}
            disabled={!currentPatient || isConfiguring}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfiguring ? 'Configuration...' : 'Configurer & Initialiser l\'Accéléromètre'}
          </button>

          {accelerometerId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Accéléromètre configuré avec succès!
                  </p>
                  <p className="text-sm text-green-700">
                    ID Accéléromètre: {accelerometerId} | Patient: {currentPatient?.nom} {currentPatient?.prenom}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientConfig;
