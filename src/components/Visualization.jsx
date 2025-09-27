import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
  const [errorCodeData, setErrorCodeData] = useState([]);
  const [predictedFailuresData, setPredictedFailuresData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wrap loadAllData in useCallback
  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchErrorCodeData(),
      fetchPredictedFailuresData(),
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
    } catch (error) {
      console.error("Error fetching predicted failures data:", error);
      setPredictedFailuresData(samplePredictedFailures);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* ... rest of your JSX remains unchanged ... */}
    </div>
  );
}
