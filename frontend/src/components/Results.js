import React, { useState } from 'react';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Download, 
  RotateCcw,
  BarChart3,
  Calendar,
  Zap
} from 'lucide-react';
import ResultsSummary from './ResultsSummary';
import ResultsCharts from './ResultsCharts';
import ResultsDetails from './ResultsDetails';

const Results = ({ results, isProcessing, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (isProcessing) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Data</h3>
          <p className="text-gray-600">Please wait while we analyze your accelerometer data...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
          <p className="text-gray-600">Upload a CSV file to get started with step counting analysis.</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <div className="space-y-6">
      {/* Processing Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Processing Complete</h2>
          <button
            onClick={onReset}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Process Another File</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-2xl font-bold text-primary-900">
                  {formatNumber(results.results?.total_steps)}
                </p>
                <p className="text-sm text-primary-700">Total Steps</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-success-600" />
              <div>
                <p className="text-2xl font-bold text-success-900">
                  {formatNumber(results.results?.total_walking_minutes)}
                </p>
                <p className="text-sm text-success-700">Walking Minutes</p>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-warning-600" />
              <div>
                <p className="text-2xl font-bold text-warning-900">
                  {formatNumber(results.results?.average_daily_steps)}
                </p>
                <p className="text-sm text-warning-700">Avg Daily Steps</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Processing Time:</span>
            <span className="font-medium">{formatTime(results.processing_time)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data Duration:</span>
            <span className="font-medium">{formatTime(results.results?.data_duration_hours * 3600)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sample Rate:</span>
            <span className="font-medium">{results.results?.sample_rate} Hz</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model Type:</span>
            <span className="font-medium">{results.results?.model_type || 'SSL'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'summary', label: 'Summary', icon: BarChart3 },
              { id: 'charts', label: 'Charts', icon: TrendingUp },
              { id: 'details', label: 'Details', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'summary' && (
            <ResultsSummary results={results} />
          )}
          {activeTab === 'charts' && (
            <ResultsCharts results={results} />
          )}
          {activeTab === 'details' && (
            <ResultsDetails results={results} />
          )}
        </div>
      </div>

      {/* Download Section */}
      {results.output_files && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(results.output_files).map(([filename, path]) => (
              <div key={filename} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Download className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{filename}</span>
                </div>
                <button
                  onClick={() => {
                    // In a real implementation, you would download the file
                    console.log(`Downloading ${filename} from ${path}`);
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
