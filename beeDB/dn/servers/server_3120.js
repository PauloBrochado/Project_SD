const express = require('express');
const app = express();
const PORT = 3120;

app.use(express.json());

app.get('/status', (req, res) => {
  res.json({
    json: "CopyEdit",
    resp: {
      error: 0,
      code: "SUCCESS",
      errno: 0,
      message: "Operação realizada com sucesso",
      data: {
        service: "dn_n1s2",
        started: new Date().toISOString(),
        uptime: process.uptime()
      }
    }
  });
});

app.listen(PORT, () => {
  console.log("dn_n1s2 running on port " + PORT);
}); 