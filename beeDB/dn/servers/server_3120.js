const express = require('express');
const app = express();
const PORT = 3120;

app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    resp: {
      error: 0,
      data: {
        service: "n1s0",
        started: new Date().toISOString(),
        uptime: process.uptime()
      }
    }
  });
});

app.listen(PORT, () => {
  console.log("n1s0 running on port " + PORT);
}); 