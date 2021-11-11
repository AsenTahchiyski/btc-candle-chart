async function main() {
  const chartDataRaw = await getInitialData(0.3);
  this.chartData = chartDataRaw.map(item => this.transformDataBinance(item));

  // Create chart
  chart = Highcharts.stockChart('container', {
    rangeSelector: {
      buttons: [ // top left buttons for chart width range
        {
          count: 30,
          type: 'minute',
          text: '30m'
        },{
          count: 6,
          type: 'hour',
          text: '6h'
        }, {
          count: 1,
          type: 'day',
          text: '1D'
        }, {
          type: 'all',
          text: 'All'
        }
      ],
      selected: 0
    },

    title: {
      text: 'Bitcoin price in Euro'
    },

    series: [{
      type: 'candlestick',
      name: 'Bitcoin price in Euro',
      data: this.chartData
    }],

    chart: {
      events: {
        // Set up chart updates
        load: () => {
          if (typeof (worker) === 'undefined') {
            worker = new Worker('WebSocketWebWorker.js');
          }

          let candle;

          // Add a new candle every minute
          setInterval(() => {
            const series = chart.series[0];
            const now = new Date();

            if (now.getSeconds() === 0 && candle) {
              now.setSeconds(0, 0);
              candle[0] = now.getTime();
              series.addPoint(candle, true, false);
            }
          }, 1000);

          worker.onmessage = event => {
            candle = this.transformDataKraken(event.data);
          }
        }
      }
    },

    time: {
      useUTC: false
    }
  });
}

// Transform Kraken to D3 data format
function transformDataKraken(item) {
  return [
    parseFloat(item[0]) * 1000, // Timestamp
    parseFloat(item[2]), // Open
    parseFloat(item[3]), // High
    parseFloat(item[4]), // Low
    parseFloat(item[5]), // Close
  ];
}

// Transform Binance to D3 data format
function transformDataBinance(item) {
  return [
    parseFloat(item[0]), // Timestamp
    parseFloat(item[1]), // Open
    parseFloat(item[2]), // High
    parseFloat(item[3]), // Low
    parseFloat(item[4]), // Close
  ];
}

// Fetch price history
async function getInitialData(numberOfDays) {
  const now = new Date().getTime();
  const offset = (24 * 60 * 60 * 1000) * numberOfDays;
  const start = new Date().setTime(now - offset);

  const url = new URL('https://api.binance.com/api/v3/klines');
  url.searchParams.append('symbol', 'BTCEUR');
  url.searchParams.append('interval', '1m');
  url.searchParams.append('startTime', start);
  url.searchParams.append('endTime', now);
  // url.searchParams.append('limit', 1000);

  const response = await fetch(url.href)
  return await response.json();
}

window.onbeforeunload = () => {
  worker.postMessage({ status: 'closing' });
}

let chart;
main();
