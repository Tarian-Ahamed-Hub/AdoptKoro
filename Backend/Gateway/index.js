require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http')
const app = express();

app.use((err, req, res, next) => {
  console.error(err);
  res.status(502).json({ error: "Bad Gateway" });
});

app.use('/api/auth', createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
app.use('/api/post', createProxyMiddleware({ target: process.env.POST_SERVICE_URL, changeOrigin: true }));
app.use('/api/interaction', createProxyMiddleware({ target: process.env.INTERACTION_SERVICE_URL, changeOrigin: true }));

app.get('/', (req, res) => res.send('Pet Adoption API Gateway Running'));
const port= process.env.GATEWAY_PORT;

const appServer = http.createServer(app)
appServer.listen(port, () => console.log(`Gateway-Service running on port ${port}`));