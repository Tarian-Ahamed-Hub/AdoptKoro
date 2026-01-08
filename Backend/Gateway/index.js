require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();


app.use('/api/user', createProxyMiddleware({ target: process.env.USER_SERVICE_URL, changeOrigin: true }));
// app.use('/posts', createProxyMiddleware({ target: process.env.POST_SERVICE_URL, changeOrigin: true }));
// app.use('/interactions', createProxyMiddleware({ target: process.env.INTERACTION_SERVICE_URL, changeOrigin: true }));

app.get('/', (req, res) => res.send('Pet Adoption API Gateway Running'));

app.listen(process.env.PORT, () => console.log('API Gateway on port 8000'));