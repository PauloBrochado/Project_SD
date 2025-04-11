const express = require('express');
const app = express();
const PORT = 4000;

app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    resp: {
      error: 0,
      data: {
        service: "__SERVER_NAME__",
        started: new Date().toISOString(),
        uptime: process.uptime()
      }
    }
  });
});

app.listen(PORT, () => {
  console.log("__SERVER_NAME__ running on port " + PORT);
});
