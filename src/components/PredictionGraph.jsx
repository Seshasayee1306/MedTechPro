// src/components/PredictionGraph.jsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Typography, Box, CircularProgress } from '@mui/material';

const PredictionGraph = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:3001";

  const fetchPredictions = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/latest-predictions`);
      const json = await res.json();
      if (json.data) {
        setPredictions(json.data);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000); // refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>📈 Predicted Failures (Azure)</Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={predictions}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="machine_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="predicted_failure" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default PredictionGraph;
