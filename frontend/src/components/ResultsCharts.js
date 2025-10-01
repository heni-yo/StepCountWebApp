import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ResultsCharts = ({ results }) => {
  const stats = results.results;
  if (!stats) return null;

  // Generate sample data for charts (in a real app, this would come from the API)
  const generateHourlyData = () => {
    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        steps: Math.floor(Math.random() * 200) + 50,
        enmo: Math.random() * 50 + 10
      });
    }
    return data;
  };

  const generateDailyData = () => {
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      data.push({
        day: days[i],
        steps: Math.floor(Math.random() * 5000) + 2000,
        walking: Math.floor(Math.random() * 120) + 30
      });
    }
    return data;
  };

  const generateCadenceData = () => {
    return [
      { name: '0-60', value: 15, color: '#ef4444' },
      { name: '60-90', value: 25, color: '#f97316' },
      { name: '90-120', value: 35, color: '#eab308' },
      { name: '120+', value: 25, color: '#22c55e' }
    ];
  };

  const hourlyData = generateHourlyData();
  const dailyData = generateDailyData();
  const cadenceData = generateCadenceData();

  return (
    <div className="space-y-8">
      {/* Hourly Steps Chart */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Hourly Step Distribution</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                interval={1}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="steps" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Steps Chart */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Daily Steps Comparison</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cadence Distribution */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Cadence Distribution</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cadenceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cadenceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900">Cadence Ranges</h5>
            <div className="space-y-3">
              {cadenceData.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name} steps/min</span>
                  <span className="text-sm font-medium text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Intensity Chart */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Intensity (ENMO) Over Time</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 12 }}
                interval={1}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="enmo" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Chart Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Peak Activity Hour</p>
            <p className="font-semibold text-gray-900">14:00 - 15:00</p>
          </div>
          <div>
            <p className="text-gray-600">Most Active Day</p>
            <p className="font-semibold text-gray-900">Wednesday</p>
          </div>
          <div>
            <p className="text-gray-600">Average Cadence</p>
            <p className="font-semibold text-gray-900">95 steps/min</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsCharts;
