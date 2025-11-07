const fs = require('fs');
const path = require('path');

// Data storage path
const dataDir = '/tmp/data';
const usersFile = path.join(dataDir, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper functions to read/write data
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
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
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
      const users = readJSON(usersFile);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(Object.values(users))
      };
    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      const users = readJSON(usersFile);
      
      // Check if user already exists
      const existingUser = Object.values(users).find(u => u.name === data.name);
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User already exists' })
        };
      }
      
      const userId = Date.now().toString();
      
      users[userId] = {
        id: userId,
        ...data,
        createdAt: new Date().toISOString()
      };
      
      if (writeJSON(usersFile, users)) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, user: users[userId] })
        };
      } else {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to save user' })
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
