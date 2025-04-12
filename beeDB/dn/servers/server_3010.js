const express = require('express');
const app = express();
const PORT = 3010;

app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    resp: {
      error: 0,
      data: {
        service: "dn_n0s1",
        started: new Date().toISOString(),
        uptime: process.uptime()
      }
    }
  });
});

app.listen(PORT, () => {
  console.log("dn_n0s1 running on port " + PORT);
}); 