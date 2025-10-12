import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function AthenaQuery() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [columns, setColumns] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "http://localhost:3001";

  const runSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResults([]);
      setColumns([]);

      const response = await fetch(`${BACKEND_URL}/api/search-athena`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchTerm })
      });

      const data = await response.json();
      console.log('✅ Athena data.data:', data.data);

      if (response.ok && Array.isArray(data.data) && data.data.length > 0) {
        const columnNames = Object.keys(data.data[0]);

        const rows = data.data.map(row =>
          columnNames.map(col => {
            const value = row[col];
        
            // Case 1: Value is an object with VarCharValue
            if (value && typeof value === 'object' && 'VarCharValue' in value) {
              return value.VarCharValue;
            }
        
            // Case 2: Value is an array of objects with VarCharValue (e.g., multiple errors)
            if (Array.isArray(value) && value.every(item => typeof item === 'object' && 'VarCharValue' in item)) {
              return value.map(item => item.VarCharValue).join(', ');
            }
        
            // Case 3: Just return string fallback
            return value !== null && value !== undefined ? value.toString() : '';
          })
        );

        setColumns(columnNames);
        setResults(rows);
      } else {
        setError(data.error || 'No results found.');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to reset search and trigger a new search
  const handleRefresh = () => {
    setSearchTerm('');
    setResults([]);
    setColumns([]);
    setError(null);
    runSearch();
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Search MRI Logs (Athena)
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="Search by status, machine ID, error code..."
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '400px', mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={runSearch}
          disabled={loading}
          sx={{ padding: '8px 20px', fontSize: '16px' }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleRefresh}
          sx={{ padding: '8px 20px', fontSize: '16px', ml: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : results.length > 0 ? (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col, idx) => (
                  <TableCell key={idx} align="center">
                    <Typography variant="h6" color="textPrimary">
                      {col}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j} align="center">
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : !error && !loading ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          No results found.
        </Typography>
      ) : null}
    </Container>
  );
}

export default AthenaQuery;
