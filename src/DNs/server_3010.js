const express = require('express');
const app = express();
const PORT = 3010;

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