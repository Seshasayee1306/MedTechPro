// ✅ ES Module style imports
import express from 'express';
import AWS from 'aws-sdk';
import cors from 'cors';
import { BlobServiceClient } from '@azure/storage-blob';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';


dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// AWS setup
const s3 = new AWS.S3({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

const athena = new AWS.Athena({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

const kinesis = new AWS.Kinesis({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

const ses = new AWS.SES({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

// Streaming state
let streamingInterval = null;
let isStreaming = false;

// Helper
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// Routes

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/api/s3-contents', async (req, res) => {
  try {
    const params = { Bucket: process.env.REACT_APP_S3_BUCKET };
    const data = await s3.listObjects(params).promise();
    res.json(data.Contents || []);
  } catch (error) {
    console.error('S3 Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📥 Generate pre-signed URL for S3 file download
app.get('/api/download-url', async (req, res) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ error: 'Missing file key in query' });
  }

  const params = {
    Bucket: process.env.REACT_APP_S3_BUCKET,
    Key: key,
    Expires: 60 * 5 // URL expires in 5 minutes
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    res.json({ success: true, url });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

app.get('/api/latest-s3-log', async (req, res) => {
  try {
    const list = await s3.listObjectsV2({
      Bucket: process.env.REACT_APP_S3_BUCKET,
      Prefix: 'kinesis-stream/'
    }).promise();

    const latest = list.Contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified))[0];
    if (!latest) return res.json({ data: [] });

    const data = await s3.getObject({
      Bucket: process.env.REACT_APP_S3_BUCKET,
      Key: latest.Key
    }).promise();

    const parsed = JSON.parse(data.Body.toString());
    res.json({ data: Array.isArray(parsed) ? parsed : [parsed] });
  } catch (err) {
    console.error('S3 fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/search-athena', async (req, res) => {
  const { keyword } = req.body;

  if (!keyword) return res.status(400).json({ error: 'Keyword is required' });

  const db = 'prmaintain_data'; // explicitly set database name
  const tbl = 'kinesis_data';   // explicitly set table name
  const table = `${db}.${tbl}`;

  // Escape single quotes in keyword
  const kw = keyword.trim().toLowerCase().replace(/'/g, "''");


  const query = `
    SELECT 
      item.timestamp,
      item.machine_id,
      item.error_code,
      item.status,
      item.message,
      item.start_time,
      item.end_time,
      item.machine_runtime,
      item.resolved
    FROM ${table}
    CROSS JOIN UNNEST(array) AS t(item)
    WHERE 
      LOWER(item.status) LIKE '%${kw}%' OR
      LOWER(item.machine_id) LIKE '%${kw}%' OR
      LOWER(item.error_code) LIKE '%${kw}%' OR
      CAST(item.timestamp AS VARCHAR) LIKE '%${kw}%'
    LIMIT 100;
  `;

  const params = {
    QueryString: query,
    ResultConfiguration: {
      OutputLocation: process.env.REACT_APP_ATHENA_OUTPUT_LOCATION,
    },
    QueryExecutionContext: {
      Database: db,
    },
  };

  try {
    console.log(`🔍 Executing Athena query:\n${query}`);
    const startQuery = await athena.startQueryExecution(params).promise();
    const executionId = startQuery.QueryExecutionId;

    let state = 'RUNNING';
    while (state === 'RUNNING' || state === 'QUEUED') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const statusCheck = await athena.getQueryExecution({ QueryExecutionId: executionId }).promise();
      state = statusCheck.QueryExecution.Status.State;
    }

    if (state !== 'SUCCEEDED') {
      const failureReason = await athena.getQueryExecution({ QueryExecutionId: executionId }).promise();
      console.error('❌ Athena Query Failed:', failureReason.QueryExecution.Status.StateChangeReason);
      throw new Error(`Athena query failed: ${state} - ${failureReason.QueryExecution.Status.StateChangeReason}`);
    }

    const results = await athena.getQueryResults({ QueryExecutionId: executionId }).promise();

    const processedResults = results.ResultSet.Rows.map(row => {
      const rowData = {};
      results.ResultSet.ResultSetMetadata.ColumnInfo.forEach((col, index) => {
        rowData[col.Name] = row.Data[index]?.VarCharValue || '';
      });
      return rowData;
    });

    console.log('Processed Results:', processedResults); 

    res.json({ data: results.ResultSet.Rows });  // Ensure 'data' is wrapped around the results


  } catch (error) {
    console.error('Athena Error:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/databricks-predictions', async (req, res) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.REACT_APP_AZURE_CONTAINER_NAME);
    const targetBlobName = 'predicted_errors.csv/part-00000-tid-2952257645147565659-d89282ae-b6d4-4c30-b495-fa6e29f42204-11306-1-c000.csv';
    const blockBlobClient = containerClient.getBlockBlobClient(targetBlobName);

    const exists = await blockBlobClient.exists();
    if (!exists) return res.status(404).json({ error: 'CSV not found' });

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const records = parse(downloaded, { columns: true, skip_empty_lines: true, trim: true });

    console.log(`Parsed ${records.length} records from ${targetBlobName}`);
    res.json({ success: true, file: targetBlobName, data: records });
  } catch (error) {
    console.error('Azure Blob fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/latest-predictions', async (req, res) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.REACT_APP_AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.REACT_APP_AZURE_CONTAINER_NAME);

    const csvPattern = /part-\d+-tid-\d+-[\w-]+-c000\.csv$/;
    let latestBlob = null;
    let latestModified = new Date(0);

    for await (const blob of containerClient.listBlobsFlat({ prefix: 'predicted_errors.csv/' })) {
      if (blob?.name && csvPattern.test(blob.name)) {
        const modifiedDate = new Date(blob.properties.lastModified);
        if (modifiedDate > latestModified) {
          latestModified = modifiedDate;
          latestBlob = blob;
        }
      }
    }

    if (!latestBlob) return res.status(404).json({ error: 'No matching CSV found' });

    const blockBlobClient = containerClient.getBlockBlobClient(latestBlob.name);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);
    const records = parse(downloaded, { columns: true, skip_empty_lines: true, trim: true });

    console.log(`Parsed ${records.length} records from ${latestBlob.name}`);
    res.json({
      success: true,
      file: latestBlob.name,
      lastModified: latestModified.toISOString(),
      data: records
    });

  } catch (error) {
    console.error('Azure Blob error:', error.message);
    res.status(500).json({ error: error.message });
  }
});




import fetch from 'node-fetch';

app.post('/api/run-databricks-job', async (req, res) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_DATABRICKS_HOST}/api/2.1/jobs/run-now`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_DATABRICKS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ job_id: parseInt(process.env.REACT_APP_DATABRICKS_JOB_ID) })
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Databricks job triggered:", result.run_id);
      res.json({ success: true, run_id: result.run_id });
    } else {
      console.error("❌ Error triggering job:", result);
      res.status(500).json({ error: result.message || 'Failed to run job' });
    }
  } catch (error) {
    console.error("❌ Error hitting Databricks API:", error.message);
    res.status(500).json({ error: error.message });
  }
});


// ▶️ Toggle Streaming
app.post('/api/toggle-stream', async (req, res) => {
  const streamName = process.env.REACT_APP_KINESIS_STREAM_NAME;
  if (!streamName) return res.status(500).json({ error: 'Missing stream name in env' });

  if (isStreaming) {
    clearInterval(streamingInterval);
    isStreaming = false;
    console.log("⛔ Streaming stopped");
    return res.json({ success: true, streaming: false });
  }

  streamingInterval = setInterval(() => {
    const now = Math.floor(Date.now() / 1000);
    const start_time = now - Math.floor(Math.random() * 1000);
    const end_time = start_time + Math.floor(Math.random() * 1000);
    const machine_runtime = end_time - start_time;

    const payload = {
      timestamp: now,
      machine_id: `MRI_00${Math.floor(Math.random() * 4) + 1}`,
      error_code: `E${Math.floor(Math.random() * 300)}`,
      status: ["Idle", "Running", "Error"][Math.floor(Math.random() * 3)],
      message: "Generated from backend",
      start_time,
      end_time,
      machine_runtime,
      resolved: Math.random() < 0.5
    };

    const params = {
      Data: Buffer.from(JSON.stringify(payload)),
      PartitionKey: payload.machine_id,
      StreamName: streamName
    };

    kinesis.putRecord(params, (err, data) => {
      if (err) console.error("❌ Kinesis error:", err);
      else console.log(`✔ Sent to Kinesis at ${new Date().toISOString()}`);
    });
  }, 5000);

  isStreaming = true;
  console.log("▶️ Streaming started");
  res.json({ success: true, streaming: true });
});

// 📩 Email Endpoint (AWS SES)
app.post('/api/send-maintenance-email', async (req, res) => {
  const { toEmail } = req.body;

  if (!toEmail) return res.status(400).json({ error: "Recipient email is required" });

  const params = {
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Body: {
        Text: {
          Data: "This is an automated alert. Please prepare the MRI machine for maintenance."
        }
      },
      Subject: { Data: "🚨 Maintenance Alert: MRI Equipment" }
    },
    Source: process.env.REACT_APP_SES_VERIFIED_EMAIL
  };

  try {
    await ses.sendEmail(params).promise();
    console.log(`✅ Email sent to ${toEmail}`);
    res.json({ success: true, message: `Email sent to ${toEmail}` });
  } catch (error) {
    console.error('❌ SES Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
