const express = require('express');
const app = express();
const PORT = "{{PORT}}";

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