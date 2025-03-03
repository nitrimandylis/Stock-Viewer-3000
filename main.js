const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('dist/index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// Setup IPC handlers for stock data
function setupIpcHandlers() {
  // Handle fetch-stocks request
  ipcMain.on('fetch-stocks', async (event) => {
    try {
      // In a real app, you would fetch from an actual API
      // For now, using mock data
      const mockData = [
        { symbol: 'AAPL', price: 150.25, change: 2.5 },
        { symbol: 'GOOGL', price: 2750.80, change: -1.2 },
        { symbol: 'MSFT', price: 310.15, change: 0.8 }
      ];
      
      // Send the data back to the renderer
      event.reply('stock-data', mockData);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      event.reply('api-error', { message: 'Failed to fetch stock data' });
    }
  });

  // Handle fetch-historical-data request
  ipcMain.on('fetch-historical-data', async (event, { symbol, period }) => {
    try {
      // In a real app, you would fetch from an actual API based on symbol and period
      // For now, using mock data
      const mockHistorical = {
        labels: ['9:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
        prices: [150.25, 151.30, 149.80, 152.00, 151.50, 150.75]
      };
      
      // Send the data back to the renderer
      event.reply('historical-data', mockHistorical);
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      event.reply('api-error', { message: `Failed to fetch historical data for ${symbol}` });
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});