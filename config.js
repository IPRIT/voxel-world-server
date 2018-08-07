export const config = {
  "env": process.env.NODE_ENV,
  "secureProtocol": false,
  "ip": "",
  "port": "9001",
  "socket": {
    "options": {
      "serveClient": false,
      // below are engine.IO options
      "pingInterval": 2000,
      "pingTimeout": 5000,
      "cookie": false
    }
  },
  "serverApi": {
    "protocol": "http",
    "host": "localhost:9000"
  }
};