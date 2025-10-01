import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { processFile } from '../services/api';

const ManualTest = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setResults(null);
    } else {
      toast.error('Veuillez sélectionner un fichier CSV valide');
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model_type', 'rf');

      const result = await processFile(formData);
      
      if (result.success) {
        setResults(result.results);
        toast.success('Fichier traité avec succès!');
      } else {
        toast.error(`Erreur: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Test Manuel
        </h2>
        <p className="text-gray-600">
          Sélectionnez un fichier CSV depuis votre ordinateur pour tester le système de comptage de pas
        </p>
      </div>

      {/* Sélection de fichier */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          1. Sélection du Fichier CSV
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label htmlFor="csv-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.5C5.072 5.5 5 5.4 5 5.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5z"/>
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.5C5.072 5.5 5 5.4 5 5.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25v-.5z"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Cliquez pour sélectionner</span> un fichier CSV
                </p>
                <p className="text-xs text-gray-500">CSV uniquement</p>
              </div>
              <input 
                id="csv-file" 
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Fichier sélectionné: {selectedFile.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    Taille: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Traitement */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          2. Traitement du Fichier
        </h3>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Cliquez sur le bouton ci-dessous pour traiter le fichier CSV avec l'algorithme Random Forest
            et obtenir le nombre de pas détectés.
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={handleProcessFile}
              disabled={!selectedFile || isProcessing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Traitement en cours...' : 'Traiter le Fichier'}
            </button>
            
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Réinitialiser
            </button>
          </div>

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

      {/* Résultats */}
      {results && (
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            3. Résultats du Traitement
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Statistiques Principales</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre total de pas:</span>
                  <span className="font-semibold text-2xl text-blue-600">{results.total_steps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée des données:</span>
                  <span className="font-semibold">{results.data_duration_hours.toFixed(2)} heures</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fréquence d'échantillonnage:</span>
                  <span className="font-semibold">{results.sample_rate} Hz</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Informations Supplémentaires</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Temps de marche total:</span>
                  <span className="font-semibold">{results.total_walking_minutes.toFixed(1)} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Moyenne quotidienne:</span>
                  <span className="font-semibold">{results.average_daily_steps.toFixed(0)} pas/jour</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualTest;
