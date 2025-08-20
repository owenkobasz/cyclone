const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function callPythonRouteBackend(preferences) {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, '../route_backend.py');
    const venvPythonPath = path.join(__dirname, '../venv', 'bin', 'python3');
    
    // Use virtual environment Python if it exists, otherwise fallback to system Python (or set up Docker)
    const pythonCommand = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python3';
    const python = spawn(pythonCommand, [pythonScriptPath, 'generate_route']);

    let outputData = '';
    let errorData = '';

    // Send preferences to Python script
    python.stdin.write(JSON.stringify(preferences));
    python.stdin.end();

    python.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(outputData);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorData}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

// Wrapper function that matches the expected name
async function callPythonBackend(start, end, options) {
  const preferences = {
    start,
    end,
    options
  };
  return await callPythonRouteBackend(preferences);
}

module.exports = {
  callPythonRouteBackend,
  callPythonBackend
};
