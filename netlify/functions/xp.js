const fs = require('fs');
const path = require('path');

const dataDir = '/tmp/data';
const xpFile = path.join(dataDir, 'xp.json');
const clickedFile = path.join(dataDir, 'clicked.json');

function readJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading file:', e);
  }
  return {};
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
    'Access-Control-Allow-Methods': 'GET, POST'
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
      const xpData = readJSON(xpFile);
      const clickedData = readJSON(clickedFile);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ xp: xpData, clicked: clickedData })
      };
    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (event.path.includes('xp')) {
        const xpData = readJSON(xpFile);
        xpData[data.username] = data.xp;
        
        if (writeJSON(xpFile, xpData)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }
      } else if (event.path.includes('clicked')) {
        const clickedData = readJSON(clickedFile);
        if (!clickedData[data.username]) {
          clickedData[data.username] = [];
        }
        if (!clickedData[data.username].includes(data.targetUser)) {
          clickedData[data.username].push(data.targetUser);
        }
        
        if (writeJSON(clickedFile, clickedData)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }
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
