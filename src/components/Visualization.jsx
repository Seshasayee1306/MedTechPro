import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';

// Custom colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Sample fallback data
const sampleErrorCodeData = [
  { errorCode: "E123", count: 42 },
  { errorCode: "E045", count: 38 },
  { errorCode: "E211", count: 27 },
  { errorCode: "E078", count: 19 },
  { errorCode: "E156", count: 15 }
];

const samplePredictedFailures = [
  { name: "MRI_001", value: 12 },
  { name: "MRI_002", value: 8 },
  { name: "MRI_003", value: 5 },
  { name: "MRI_004", value: 3 }
];

export default function Visualization() {
  const [errorCodeData, setErrorCodeData] = useState(sampleErrorCodeData);
  const [predictedFailuresData, setPredictedFailuresData] = useState(samplePredictedFailures);
  const [loading, setLoading] = useState(false);

  // Wrap loadAllData in useCallback to avoid useEffect warnings
  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchErrorCodeData(),
      fetchPredictedFailuresData()
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const fetchErrorCodeData = async () => {
    try {
      const response = await fetch('/api/search-athena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'Error' })
      });
      if (!response.ok) throw new Error('Failed to fetch error codes');

      const result = await response.json();
      if (result.data && result.data.length > 1) {
        const errorCodeCounts = {};
        result.data.slice(1).forEach(row => {
          if (row.Data && row.Data[2] && row.Data[2].VarCharValue) {
            const errorCode = row.Data[2].VarCharValue;
            errorCodeCounts[errorCode] = (errorCodeCounts[errorCode] || 0) + 1;
          }
        });

        const processed = Object.entries(errorCodeCounts)
          .map(([errorCode, count]) => ({ errorCode, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setErrorCodeData(processed.length > 0 ? processed : sampleErrorCodeData);
      } else {
        setErrorCodeData(sampleErrorCodeData);
      }
    } catch (err) {
      console.error('Error loading error code data:', err);
      setErrorCodeData(sampleErrorCodeData);
    }
  };

  const fetchPredictedFailuresData = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/latest-predictions");
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const processed = result.data.map(item => ({
          name: item.machine_id,
          value: parseFloat(item.avg_predicted_errors)
        }));
        setPredictedFailuresData(processed);
      } else {
        setPredictedFailuresData(samplePredictedFailures);
      }
    } catch (err) {
      console.error('Error fetching predicted failures data:', err);
      setPredictedFailuresData(samplePredictedFailures);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
        Machine Monitoring Dashboard
      </h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={loadAllData}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 px-4 rounded shadow"
        >
          Refresh Data
        </button>
      </div>

      {loading && (
        <div className="text-center text-gray-600 mb-4">Loading charts, please wait...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Code Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Top Error Codes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorCodeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="errorCode" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Predicted Failures Pie Chart */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Predicted Machine Failures</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={predictedFailuresData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {predictedFailuresData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
