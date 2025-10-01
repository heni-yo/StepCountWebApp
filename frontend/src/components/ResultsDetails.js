import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertCircle } from 'lucide-react';

const ResultsDetails = ({ results }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(1)}%`;
  };

  const stats = results.results;
  if (!stats) return null;

  const sections = [
    {
      id: 'wear_stats',
      title: 'Wear Time Statistics',
      icon: Info,
      data: stats.wear_stats || {}
    },
    {
      id: 'steps_summary',
      title: 'Steps Analysis',
      icon: Info,
      data: stats.steps_summary || {}
    },
    {
      id: 'enmo_summary',
      title: 'Activity Intensity (ENMO)',
      icon: Info,
      data: stats.enmo_summary || {}
    },
    {
      id: 'cadence_summary',
      title: 'Cadence Analysis',
      icon: Info,
      data: stats.cadence_summary || {}
    },
    {
      id: 'bouts_summary',
      title: 'Walking Bouts',
      icon: Info,
      data: stats.bouts_summary || {}
    }
  ];

  const renderDataTable = (data, excludeKeys = []) => {
    const filteredData = Object.entries(data).filter(([key]) => !excludeKeys.includes(key));
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map(([key, value]) => (
              <tr key={key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {typeof value === 'number' ? formatNumber(value) : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const Icon = section.icon;
        const isExpanded = expandedSections[section.id];
        const hasData = Object.keys(section.data).length > 0;

        return (
          <div key={section.id} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                {!hasData && (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {isExpanded && (
              <div className="px-6 pb-6">
                {hasData ? (
                  renderDataTable(section.data)
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No data available for this section</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Processing Information */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('processing_info')}
          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Processing Information</h3>
          </div>
          {expandedSections.processing_info ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {expandedSections.processing_info && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">File Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Time:</span>
                    <span className="font-medium">{results.processing_time.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success:</span>
                    <span className="font-medium">{results.success ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-medium">{results.message}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Data Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sample Rate:</span>
                    <span className="font-medium">{stats.sample_rate} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{stats.data_duration_hours?.toFixed(2)} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model Type:</span>
                    <span className="font-medium">SSL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Files */}
      {results.output_files && (
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('output_files')}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Generated Files</h3>
            </div>
            {expandedSections.output_files ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedSections.output_files && (
            <div className="px-6 pb-6">
              <div className="space-y-3">
                {Object.entries(results.output_files).map(([filename, path]) => (
                  <div key={filename} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900">{filename}</span>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultsDetails;
