import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const WebUSBManager = ({ onDataExtracted, onDeviceConnected, onDeviceDisconnected }) => {
  const [device, setDevice] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  // Vérifier si WebUSB est supporté
  const isWebUSBSupported = () => {
    return 'usb' in navigator;
  };

  // Détecter les appareils USB disponibles
  const detectDevices = async () => {
    if (!isWebUSBSupported()) {
      toast.error('WebUSB n\'est pas supporté par ce navigateur');
      return;
    }

    try {
      const devices = await navigator.usb.getDevices();
      console.log('Appareils USB détectés:', devices);
      
      if (devices.length > 0) {
        // Prendre le premier appareil détecté
        const firstDevice = devices[0];
        setDevice(firstDevice);
        setIsConnected(true);
        setDeviceInfo({
          productName: firstDevice.productName || 'Accéléromètre',
          manufacturerName: firstDevice.manufacturerName || 'Fabricant inconnu',
          serialNumber: firstDevice.serialNumber || 'N/A'
        });
        onDeviceConnected && onDeviceConnected(firstDevice);
        toast.success('Accéléromètre connecté via USB!');
      } else {
        toast.info('Aucun accéléromètre détecté. Veuillez connecter l\'appareil.');
      }
    } catch (error) {
      console.error('Erreur lors de la détection:', error);
      toast.error(`Erreur de détection: ${error.message}`);
    }
  };

  // Demander l'autorisation pour un nouvel appareil
  const requestDevice = async () => {
    if (!isWebUSBSupported()) {
      toast.error('WebUSB n\'est pas supporté par ce navigateur');
      return;
    }

    try {
      // Filtrer les appareils par vendor ID et product ID si nécessaire
      const device = await navigator.usb.requestDevice({
        filters: [
          // Ajouter des filtres spécifiques pour votre accéléromètre
          { classCode: 0x00 }, // Tous les appareils
        ]
      });

      setDevice(device);
      setIsConnected(true);
      setDeviceInfo({
        productName: device.productName || 'Accéléromètre',
        manufacturerName: device.manufacturerName || 'Fabricant inconnu',
        serialNumber: device.serialNumber || 'N/A'
      });
      onDeviceConnected && onDeviceConnected(device);
      toast.success('Accéléromètre connecté avec succès!');
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      if (error.name === 'NotFoundError') {
        toast.info('Aucun appareil sélectionné');
      } else {
        toast.error(`Erreur de connexion: ${error.message}`);
      }
    }
  };

  // Se connecter à l'appareil
  const connectDevice = async () => {
    if (!device) {
      toast.error('Aucun appareil sélectionné');
      return;
    }

    try {
      await device.open();
      console.log('Appareil ouvert:', device);
      toast.success('Connexion établie avec l\'accéléromètre!');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error(`Erreur de connexion: ${error.message}`);
    }
  };

  // Extraire les données CSV
  const extractCSVData = async () => {
    if (!device || !isConnected) {
      toast.error('Aucun appareil connecté');
      return;
    }

    setIsExtracting(true);
    try {
      // Simuler la lecture des données CSV depuis l'accéléromètre
      // Dans un vrai scénario, vous devriez implémenter le protocole de communication
      // avec votre accéléromètre spécifique
      
      console.log('Extraction des données depuis l\'accéléromètre...');
      
      // Simulation de données CSV
      const mockCSVData = generateMockCSVData();
      
      // Créer un objet File à partir des données CSV
      const csvBlob = new Blob([mockCSVData], { type: 'text/csv' });
      const csvFile = new File([csvBlob], 'accelerometer_data.csv', { type: 'text/csv' });
      
      onDataExtracted && onDataExtracted(csvFile);
      toast.success('Données CSV extraites avec succès!');
      
    } catch (error) {
      console.error('Erreur lors de l\'extraction:', error);
      toast.error(`Erreur d'extraction: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Générer des données CSV simulées
  const generateMockCSVData = () => {
    const header = 'time,x,y,z\n';
    let csvData = header;
    
    // Générer 1000 lignes de données simulées
    const startTime = new Date();
    for (let i = 0; i < 1000; i++) {
      const timestamp = new Date(startTime.getTime() + i * 10); // 10ms entre chaque échantillon
      const x = (Math.random() - 0.5) * 2; // -1 à 1
      const y = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 2;
      
      csvData += `${timestamp.toISOString()},${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}\n`;
    }
    
    return csvData;
  };

  // Déconnecter l'appareil
  const disconnectDevice = async () => {
    if (device) {
      try {
        await device.close();
        setDevice(null);
        setIsConnected(false);
        setDeviceInfo(null);
        onDeviceDisconnected && onDeviceDisconnected();
        toast.info('Accéléromètre déconnecté');
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        toast.error(`Erreur de déconnexion: ${error.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Statut WebUSB */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">
                {isWebUSBSupported() ? 'WebUSB Supporté' : 'WebUSB Non Supporté'}
              </p>
              <p className="text-sm text-blue-700">
                {isConnected ? 'Accéléromètre connecté' : 'Aucun appareil connecté'}
              </p>
            </div>
          </div>
          {isConnected && (
            <button
              onClick={disconnectDevice}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Déconnecter
            </button>
          )}
        </div>
      </div>

      {/* Informations de l'appareil */}
      {deviceInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Informations de l'Accéléromètre</h4>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>Produit:</strong> {deviceInfo.productName}</p>
            <p><strong>Fabricant:</strong> {deviceInfo.manufacturerName}</p>
            <p><strong>Série:</strong> {deviceInfo.serialNumber}</p>
          </div>
        </div>
      )}

      {/* Actions de connexion */}
      {!isConnected ? (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connexion de l'Accéléromètre
            </h3>
            <p className="text-gray-600 mb-4">
              Connectez votre accéléromètre via USB pour extraire les données
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={detectDevices}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Détecter les Appareils
            </button>
            <button
              onClick={requestDevice}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Sélectionner un Appareil
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Extraction des Données
            </h3>
            <p className="text-gray-600 mb-4">
              L'accéléromètre est connecté. Vous pouvez maintenant extraire les données CSV.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={extractCSVData}
              disabled={isExtracting}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExtracting && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isExtracting ? 'Extraction en cours...' : 'Extraire les Données CSV'}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Instructions</h4>
            <div className="mt-2 text-sm text-yellow-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Connectez l'accéléromètre à votre ordinateur via USB</li>
                <li>Cliquez sur "Détecter les Appareils" ou "Sélectionner un Appareil"</li>
                <li>Autorisez l'accès à l'appareil dans votre navigateur</li>
                <li>Cliquez sur "Extraire les Données CSV" pour récupérer les données</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebUSBManager;
