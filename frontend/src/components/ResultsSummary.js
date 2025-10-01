import React from 'react';
import { Activity, Clock, TrendingUp, Zap, Target } from 'lucide-react';

const ResultsSummary = ({ results }) => {
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

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(stats.total_steps)}</p>
                <p className="text-sm text-blue-700">Total Steps</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{formatNumber(stats.total_walking_minutes)}</p>
                <p className="text-sm text-green-700">Walking Minutes</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(stats.average_daily_steps)}</p>
                <p className="text-sm text-purple-700">Avg Daily Steps</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.sample_rate ? `${stats.sample_rate} Hz` : 'N/A'}
                </p>
                <p className="text-sm text-orange-700">Sample Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Steps Summary */}
      {stats.steps_summary && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Steps Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Overall</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Steps:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.total_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.avg_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Median:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.med_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Min:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.min_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Max:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.max_steps)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-700">Walking Time</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Walking:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.total_walk)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.avg_walk)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Median:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.med_walk)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Min:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.min_walk)} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Max:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.max_walk)} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekend vs Weekday */}
      {stats.steps_summary && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Weekend vs Weekday</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-3">Weekend</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Steps:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekend_total_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Daily Average:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekend_avg_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Walking Time:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekend_total_walk)} min</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-3">Weekday</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Total Steps:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekday_total_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Daily Average:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekday_avg_steps)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Walking Time:</span>
                  <span className="font-medium">{formatNumber(stats.steps_summary.weekday_total_walk)} min</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cadence Summary */}
      {stats.cadence_summary && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Cadence Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">Peak Cadence</h5>
              <p className="text-2xl font-bold text-purple-900">
                {formatNumber(stats.cadence_summary.peak1)} steps/min
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h5 className="font-medium text-indigo-900 mb-2">Peak 30</h5>
              <p className="text-2xl font-bold text-indigo-900">
                {formatNumber(stats.cadence_summary.peak30)} steps/min
              </p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h5 className="font-medium text-pink-900 mb-2">95th Percentile</h5>
              <p className="text-2xl font-bold text-pink-900">
                {formatNumber(stats.cadence_summary.p95)} steps/min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ENMO Summary */}
      {stats.enmo_summary && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Intensity (ENMO)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">Average ENMO</h5>
              <p className="text-2xl font-bold text-yellow-900">
                {formatNumber(stats.enmo_summary.avg)} mg
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-medium text-red-900 mb-2">Weekend Average</h5>
              <p className="text-2xl font-bold text-red-900">
                {formatNumber(stats.enmo_summary.weekend_avg)} mg
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h5 className="font-medium text-orange-900 mb-2">Weekday Average</h5>
              <p className="text-2xl font-bold text-orange-900">
                {formatNumber(stats.enmo_summary.weekday_avg)} mg
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSummary;
