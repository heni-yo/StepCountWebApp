import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { extractData, processPatientData } from '../services/patientApi';
import WebUSBManager from './WebUSBManager';

const DataExtraction = ({ currentPatient, accelerometerId, onFileProcessed }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResults, setExtractionResults] = useState(null);
  const [extractedFile, setExtractedFile] = useState(null);

  // Gérer l'extraction des données via WebUSB
  const handleDataExtracted = (file) => {
    console.log('Fichier extrait via WebUSB:', file);
    setExtractedFile(file);
    toast.success('Données CSV extraites via USB!');
  };

  // Gérer la connexion de l'appareil
  const handleDeviceConnected = (device) => {
    console.log('Appareil connecté:', device);
    toast.success('Accéléromètre connecté via USB!');
  };

  // Gérer la déconnexion de l'appareil
  const handleDeviceDisconnected = () => {
    console.log('Appareil déconnecté');
    setExtractedFile(null);
    setExtractionResults(null);
    toast.info('Accéléromètre déconnecté');
  };

  const handleProcessData = async () => {
    if (!extractedFile) {
      toast.error('Veuillez d\'abord extraire les données');
      return;
    }

    setIsProcessing(true);
    try {
      // Traiter le fichier extrait avec l'API stepcount
      if (onFileProcessed) {
        await onFileProcessed(extractedFile);
        toast.success('Données traitées et sauvegardées avec succès!');
      } else {
        toast.error('Fonction de traitement non disponible');
      }
    } catch (error) {
      toast.error(`Erreur lors du traitement: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Extraction des Données via USB
        </h2>
        <p className="text-gray-600">
          Connectez votre accéléromètre via USB et extrayez les données CSV directement
        </p>
      </div>

      {/* Statut Patient */}
      {currentPatient && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                Patient actuel: {currentPatient.nom} {currentPatient.prenom}
              </p>
              <p className="text-sm text-blue-700">
                ID Patient: {currentPatient.id} | ID Accéléromètre: {accelerometerId || 'Non configuré'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gestionnaire WebUSB */}
      <WebUSBManager
        onDataExtracted={handleDataExtracted}
        onDeviceConnected={handleDeviceConnected}
        onDeviceDisconnected={handleDeviceDisconnected}
      />

      {/* Statut d'extraction */}
      {extractedFile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Fichier CSV extrait avec succès!
              </p>
              <p className="text-sm text-green-700">
                Nom du fichier: {extractedFile.name} | Taille: {(extractedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Traitement des données */}
      {extractedFile && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Traitement des Données Extraites
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Les données ont été extraites avec succès. Vous pouvez maintenant les traiter
              avec l'algorithme de comptage de pas et les associer au patient.
            </p>
            
            <button
              onClick={handleProcessData}
              disabled={isProcessing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isProcessing ? 'Traitement en cours...' : 'Traiter et Sauvegarder'}
            </button>

            {isProcessing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      Traitement en cours...
                    </p>
                    <p className="text-sm text-yellow-700">
                      Analyse des données avec l'algorithme Random Forest
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExtraction;
