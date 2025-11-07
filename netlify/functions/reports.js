const fs = require('fs');
const path = require('path');

const dataDir = '/tmp/data';
const reportsFile = path.join(dataDir, 'reports.json');

function readJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading file:', e);
  }
  return [];
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing file:', e);
    return false;
  }
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      const reports = readJSON(reportsFile);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(reports)
      };
    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const reports = readJSON(reportsFile);
      
      reports.push({
        id: Date.now().toString(),
        ...data,
        when: new Date().toISOString()
      });
      
      if (writeJSON(reportsFile, reports)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };
      }
    } else if (event.httpMethod === 'DELETE') {
      const reports = readJSON(reportsFile);
      const reportId = event.path.split('/').pop();
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex >= 0) {
        reports.splice(reportIndex, 1);
        
        if (writeJSON(reportsFile, reports)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Report not found' })
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
