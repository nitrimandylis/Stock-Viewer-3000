import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';
import { render } from 'solid-js/web';
import Chart from 'chart.js/auto';

const App = () => {
  const [stocks, setStocks] = createSignal([]);
  const [selectedStock, setSelectedStock] = createSignal(null);
  const [selectedPeriod, setSelectedPeriod] = createSignal('today');
  const [chartInstance, setChartInstance] = createSignal(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [chartRef, setChartRef] = createSignal(null);
  const [error, setError] = createSignal(null);

  const timeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'This Year', value: 'year' }
  ];

  // Fetch stock data using IPC
  const fetchStockData = () => {
    setIsLoading(true);
    window.api.send('fetch-stocks');
  };

  const fetchHistoricalData = (symbol, period) => {
    return new Promise((resolve) => {
      window.api.send('fetch-historical-data', { symbol, period });
      // Set up a one-time listener to resolve the promise when data is received
      window.api.receive('historical-data', (data) => {
        resolve(data);
      });
    });
  };

  const renderChart = async (stock, period) => {
    if (!stock || !chartRef()) {
      setError('Invalid chart parameters');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
    
      // Ensure previous chart is properly destroyed
      if (chartInstance()) {
        chartInstance().destroy();
        setChartInstance(null);
        await new Promise(resolve => setTimeout(resolve, 0)); // Allow DOM to update
      }
    
      const data = await fetchHistoricalData(stock.symbol, period);
      
      // Verify canvas context is available
      const ctx = chartRef()?.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }
    
      const newChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: stock.symbol,
            backgroundColor: 'rgba(102, 126, 234, 0.25)',
            borderColor: 'rgba(102, 126, 234, 1)',
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            data: data.prices,
            tension: 0.4
          }]
        },
        options: {
          animation: {
            duration: 0 // Disable animations for better performance
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: 'rgb(229, 231, 235)'
              }
            }
          },
          scales: {
            y: {
              grid: {
                color: 'rgba(229, 231, 235, 0.1)'
              },
              ticks: {
                color: 'rgb(229, 231, 235)'
              }
            },
            x: {
              grid: {
                color: 'rgba(229, 231, 235, 0.1)'
              },
              ticks: {
                color: 'rgb(229, 231, 235)'
              }
            }
          }
        }
      });
    
      setChartInstance(newChart);
    } catch (error) {
      console.error('Chart rendering error:', error);
      setError(`Failed to render chart: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    // Set up IPC listeners
    window.api.receive('stock-data', (data) => {
      setStocks(data);
      setIsLoading(false);
    });

    window.api.receive('historical-data', (data) => {
      if (chartRef() && selectedStock()) {
        // Update chart with received data
        updateChartWithData(data);
      }
    });

    window.api.receive('api-error', (error) => {
      setError(error.message);
      setIsLoading(false);
    });

    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Refresh every minute
    onCleanup(() => {
      clearInterval(interval);
    });
  });

  // Helper function to update chart with data
  const updateChartWithData = (data) => {
    try {
      if (!chartRef()) return;
      
      const ctx = chartRef().getContext('2d');
      if (!ctx) return;
      
      // Destroy previous chart if it exists
      if (chartInstance()) {
        chartInstance().destroy();
        setChartInstance(null);
      }
      
      const newChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: selectedStock().symbol,
            backgroundColor: 'rgba(102, 126, 234, 0.25)',
            borderColor: 'rgba(102, 126, 234, 1)',
            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
            data: data.prices,
            tension: 0.4
          }]
        },
        options: {
          animation: {
            duration: 0 // Disable animations for better performance
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: 'rgb(229, 231, 235)'
              }
            }
          },
          scales: {
            y: {
              grid: {
                color: 'rgba(229, 231, 235, 0.1)'
              },
              ticks: {
                color: 'rgb(229, 231, 235)'
              }
            },
            x: {
              grid: {
                color: 'rgba(229, 231, 235, 0.1)'
              },
              ticks: {
                color: 'rgb(229, 231, 235)'
              }
            }
          }
        }
      });
      
      setChartInstance(newChart);
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating chart:', error);
      setError(`Failed to update chart: ${error.message}`);
      setIsLoading(false);
    }
  };

  createEffect(() => {
    const stock = selectedStock();
    const period = selectedPeriod();
    if (stock && chartRef()) {
      renderChart(stock, period);
    }
    onCleanup(() => {
      if (chartInstance()) {
        chartInstance().destroy();
        setChartInstance(null);
      }
    });
  });

  return (
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Stock Viewer 3000</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 class="text-xl font-semibold mb-2">Watchlist</h2>
          <ul class="bg-gray-800 rounded-lg p-4">
            {stocks().map(stock => (
              <li class="cursor-pointer hover:bg-gray-700 p-3 rounded mb-2 flex justify-between items-center"
                  onClick={() => setSelectedStock(stock)}>
                <span>{stock.symbol}</span>
                <div>
                  <span class="mr-2">${stock.price.toFixed(2)}</span>
                  <span class={stock.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {stock.change >= 0 ? '▲' : '▼'} {Math.abs(stock.change)}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-2">Stock Details</h2>
          {selectedStock() && (
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium">{selectedStock().symbol}</h3>
                <select
                  class="bg-gray-700 text-white rounded px-3 py-1 outline-none"
                  value={selectedPeriod()}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  disabled={isLoading()}
                >
                  {timeOptions.map(option => (
                    <option value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div class="flex items-center mb-4">
                <span class="text-2xl font-bold mr-3">${selectedStock().price.toFixed(2)}</span>
                <span class={selectedStock().change >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {selectedStock().change >= 0 ? '▲' : '▼'} {Math.abs(selectedStock().change)}%
                </span>
              </div>
              <div class="stock-chart relative">
                {isLoading() && (
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 z-10">
                    <div class="text-blue-400">Loading chart...</div>
                  </div>
                )}
                {error() && (
                  <div class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-70 z-10">
                    <div class="text-red-400">{error()}</div>
                  </div>
                )}
                <canvas 
                  ref={el => setChartRef(el)} 
                  id="stockChart" 
                  class="w-full h-64"
                ></canvas>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

render(() => <App />, document.getElementById('app'));