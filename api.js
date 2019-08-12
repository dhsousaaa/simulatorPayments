const express = require('express')
const app = express()
const retorno = require('./index.js');

app.get('/', async function (req, res) {
    res.send("XAMBRAS!!!");
})

app.get('/simular', async function (req, res) {
    const result = await retorno.processarRetornoSandbox(req.query);
    res.send(JSON.stringify(result));
})

app.listen(3000)