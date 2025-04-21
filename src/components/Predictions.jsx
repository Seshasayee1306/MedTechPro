import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobStatus, setJobStatus] = useState('');
  const [predictedFailures, setPredictedFailures] = useState(0); // Add state for predicted failures

  const API_URL = 'http://localhost:3001'; // Ensure this matches your backend

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/latest-predictions`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      const result = await response.json();
      console.log('Predictions from backend:', result);
      setPredictions(Array.isArray(result.data) ? result.data : []);

      // Assuming your result contains a field for predicted failures in the next 16 hours
      const totalFailures = result.data.reduce((acc, prediction) => acc + (prediction.predictedFailure || 0), 0);
      setPredictedFailures(totalFailures); // Set predicted failures
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerDatabricksJob = async () => {
    try {
      setJobStatus('Triggering Databricks job...');
      const response = await fetch(`${API_URL}/api/run-databricks-job`, {
        method: 'POST',
      });
      const result = await response.json();
      if (result.success) {
        setJobStatus(`✅ Job started with Run ID: ${result.run_id}`);
      } else {
        setJobStatus(`❌ Failed to trigger job`);
      }
    } catch (error) {
      console.error('Trigger Error:', error);
      setJobStatus(`❌ ${error.message}`);
    }
  };

  // Function to refresh predictions and reset states
  const handleRefresh = () => {
    setPredictions([]);
    setPredictedFailures(0);
    setJobStatus('');
    fetchPredictions(); // Fetch predictions again
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Databricks Predictions
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={triggerDatabricksJob}
        sx={{ mb: 2, padding: '10px 20px', fontSize: '16px' }}
      >
        ▶️ Run Prediction Model
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        onClick={handleRefresh}
        sx={{ mb: 2, padding: '10px 20px', fontSize: '16px', ml: 2 }}
      >
        🔄 Refresh Predictions
      </Button>

      {jobStatus && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {jobStatus}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
      )}

      {/* Display predicted number of failures */}
      <Typography variant="h6" sx={{ mt: 2 }}>
        Predicted number of machine failures in the upcoming 16 hours: 
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : predictions.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          No prediction data available
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                {Object.keys(predictions[0]).map((key) => (
                  <TableCell key={key} align="center">
                    <Typography variant="h6" color="textPrimary">
                      {key.toUpperCase()}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {predictions.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, i) => (
                    <TableCell key={i} align="center">
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}

export default Predictions;