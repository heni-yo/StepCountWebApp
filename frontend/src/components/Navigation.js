import React from 'react';

const Navigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'patient-config',
      label: 'Configuration & Initialisation',
      description: 'Recherche patient et configuration accéléromètre'
    },
    {
      id: 'data-extraction',
      label: 'Extraction des Données',
      description: 'Extraction CSV et traitement automatique'
    },
    {
      id: 'manual-test',
      label: 'Test Manuel',
      description: 'Test manuel avec fichier CSV local'
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Navigation;
