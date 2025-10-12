import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, CircularProgress, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

function S3Contents() {
  const [s3Contents, setS3Contents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_URL = "http://localhost:3001";

  useEffect(() => {
    fetchS3Contents();
  }, []);

  const fetchS3Contents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/s3-contents`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch S3 contents');
      }

      const data = await response.json();

      // Sort by LastModified (most recent first)
      const sortedData = data.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));

      setS3Contents(sortedData);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (key) => {
    try {
      const encodedKey = encodeURIComponent(key);
      const response = await fetch(`${BACKEND_URL}/api/download-url?key=${encodedKey}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get download URL from server');
      }

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Download URL not found in response');
      }

    } catch (error) {
      console.error('Download Error:', error);
      setError(`Download failed: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    fetchS3Contents();
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: 'center', mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        S3 Bucket Contents (Newest First)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
          <Button size="small" color="primary" onClick={fetchS3Contents} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          {s3Contents.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No files found in S3 bucket
            </Typography>
          ) : (
            <List sx={{ textAlign: 'left' }}>
              {s3Contents.map((item, index) => (
                <ListItem key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <ListItemText
                    primary={item.Key}
                    secondary={`Last modified: ${new Date(item.LastModified).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleDownload(item.Key)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          You can download the files by clicking on the download icon next to each file name.
        </Typography>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRefresh}
          sx={{ padding: '10px 20px', fontSize: '16px' }}
        >
          🔄 Refresh S3 Contents
        </Button>
      </Box>
    </Container>
  );
}

export default S3Contents;
