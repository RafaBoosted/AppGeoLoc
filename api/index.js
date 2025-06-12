const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

const locations = require('./data/locations.json');

app.use(cors());

app.get('/locations', (req, res) => {
  res.json(locations);
});

app.listen(port, () => {
  console.log(`API rodando em http://localhost:${port}`);
});
