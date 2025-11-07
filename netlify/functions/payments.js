const fs = require('fs');
const path = require('path');

const dataDir = '/tmp/data';
const pendingFile = path.join(dataDir, 'pending.json');
const paidFile = path.join(dataDir, 'paid.json');

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
      const pending = readJSON(pendingFile);
      const paid = readJSON(paidFile);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ pending, paid })
      };
    } else if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (event.path.includes('pending')) {
        const pending = readJSON(pendingFile);
        pending.push({
          id: Date.now().toString(),
          ...data,
          when: new Date().toISOString()
        });
        
        if (writeJSON(pendingFile, pending)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
          };
        }
      } else if (event.path.includes('approve')) {
        const pending = readJSON(pendingFile);
        const paid = readJSON(paidFile);
        
        const paymentId = event.path.split('/').pop();
        const paymentIndex = pending.findIndex(p => p.id === paymentId);
        
        if (paymentIndex >= 0) {
          const approvedPayment = pending[paymentIndex];
          paid.push({
            ...approvedPayment,
            approvedAt: new Date().toISOString()
          });
          pending.splice(paymentIndex, 1);
          
          if (writeJSON(pendingFile, pending) && writeJSON(paidFile, paid)) {
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
            body: JSON.stringify({ error: 'Payment not found' })
          };
        }
      } else if (event.path.includes('reject')) {
        const pending = readJSON(pendingFile);
        const paymentId = event.path.split('/').pop();
        const paymentIndex = pending.findIndex(p => p.id === paymentId);
        
        if (paymentIndex >= 0) {
          pending.splice(paymentIndex, 1);
          
          if (writeJSON(pendingFile, pending)) {
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
            body: JSON.stringify({ error: 'Payment not found' })
          };
        }
      }
    } else if (event.httpMethod === 'DELETE') {
      if (event.path.includes('paid')) {
        const paid = readJSON(paidFile);
        const paidId = event.path.split('/').pop();
        const paidIndex = paid.findIndex(p => p.id === paidId);
        
        if (paidIndex >= 0) {
          paid.splice(paidIndex, 1);
          
          if (writeJSON(paidFile, paid)) {
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
            body: JSON.stringify({ error: 'Paid user not found' })
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
