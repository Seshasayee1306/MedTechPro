import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  Box, Container, Typography, Button, Paper, Grid,
  Card, CardContent, CircularProgress, Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Custom colors for charts
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

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
      const response = await fetch("http://backend:5000/api/latest-predictions");
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

  const totalErrors = errorCodeData.reduce((sum, item) => sum + item.count, 0);
  const totalPredictedFailures = predictedFailuresData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header Section */}
        <Paper 
          elevation={0}
          sx={{ 
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 4,
            p: 4,
            mb: 4,
            textAlign: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Box sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              p: 1.5,
              display: 'flex'
            }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
            Machine Monitoring Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: '#666' }}>
            Real-time analytics and predictive insights
          </Typography>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <BarChartIcon sx={{ fontSize: 32, color: 'white' }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Total Errors Logged
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  {totalErrors}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Across all error codes
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PieChartIcon sx={{ fontSize: 32, color: 'white' }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Predicted Failures
                  </Typography>
                </Box>
                <Typography variant="h2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                  {totalPredictedFailures.toFixed(1)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Average across all machines
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Refresh Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            onClick={loadAllData}
            disabled={loading}
            variant="contained"
            size="large"
            startIcon={loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <RefreshIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                boxShadow: '0 12px 32px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Refreshing Data...' : 'Refresh Data'}
          </Button>
        </Box>

        {loading && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Chip 
              icon={<CircularProgress size={16} sx={{ color: 'white !important' }} />}
              label="Loading charts, please wait..."
              sx={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                fontWeight: 600,
                py: 2.5,
                px: 1
              }}
            />
          </Box>
        )}

        {/* Charts Grid */}
        <Grid container spacing={3}>
          {/* Error Code Bar Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ 
              borderRadius: 3,
              p: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  p: 1,
                  display: 'flex'
                }}>
                  <BarChartIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    Top Error Codes
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Most frequent error occurrences
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: 2,
                p: 2
              }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={errorCodeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="errorCode"
                      style={{ fontSize: '14px', fontWeight: 600 }}
                    />
                    <YAxis style={{ fontSize: '14px', fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '2px solid #667eea',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                    <Bar 
                      dataKey="count" 
                      fill="url(#colorGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Predicted Failures Pie Chart */}
          <Grid item xs={12} lg={6}>
            <Paper sx={{ 
              borderRadius: 3,
              p: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: 2,
                  p: 1,
                  display: 'flex'
                }}>
                  <PieChartIcon sx={{ color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                    Predicted Machine Failures
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    AI-powered failure prediction
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                background: 'rgba(240, 147, 251, 0.05)',
                borderRadius: 2,
                p: 2
              }}>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={predictedFailuresData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {predictedFailuresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '2px solid #f093fb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {errorCodeData.slice(0, 4).map((item, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card sx={{ 
                borderRadius: 2,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                    Error Code
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a1a2e', my: 1 }}>
                    {item.errorCode}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 600 }}>
                    {item.count} occurrences
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}