import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Navigation from './components/Navigation';
import PatientConfig from './components/PatientConfig';
import DataExtraction from './components/DataExtraction';
import ManualTest from './components/ManualTest';
import { processFile } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('patient-config');
  const [currentPatient, setCurrentPatient] = useState(null);
  const [accelerometerId, setAccelerometerId] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePatientFound = (patient) => {
    setCurrentPatient(patient);
  };

  const handleAccelerometerConfigured = (id) => {
    setAccelerometerId(id);
  };

  const handleFileProcessed = async (file) => {
    try {
      const result = await processFile(file);
      console.log('Fichier traité avec succès:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      throw error;
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'patient-config':
        return (
          <PatientConfig 
            onPatientFound={handlePatientFound}
            onAccelerometerConfigured={handleAccelerometerConfigured}
            currentPatient={currentPatient}
            accelerometerId={accelerometerId}
          />
        );
      case 'data-extraction':
        return (
          <DataExtraction 
            currentPatient={currentPatient}
            accelerometerId={accelerometerId}
            onFileProcessed={handleFileProcessed}
          />
        );
      case 'manual-test':
        return <ManualTest />;
      default:
        return (
          <PatientConfig 
            onPatientFound={handlePatientFound}
            onAccelerometerConfigured={handleAccelerometerConfigured}
            currentPatient={currentPatient}
            accelerometerId={accelerometerId}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {renderActiveTab()}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;