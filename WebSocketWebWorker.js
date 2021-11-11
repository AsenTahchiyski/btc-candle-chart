const socket = new WebSocket('wss://ws.kraken.com');

// Set up Kraken web socket
function startWebSocketConnection() {
  socket.onmessage = msg => {
    const responseData = JSON.parse(msg.data);

    if (responseData.event === 'heartbeat' ||
      !Array.isArray(responseData[1])) {
      return;
    }

    postMessage(responseData[1]);
  }

  const subscribe = socket => {
    const payload = {
      event: "subscribe",
      subscription: {
        name: "ohlc",
      },
      pair: ["XBT/EUR"],
    };

    socket.send(JSON.stringify(payload));
  }

  var interval =
    setInterval(() => {
      if (socket.readyState) {
        subscribe(socket);
        clearInterval(interval);
      }
    }, 500);
}

onmessage = event => {
  if (event.data && event.data.status === 'closing') {
    socket.close();
    console.log('WebSocket connection closed.');
  }
}

startWebSocketConnection();
