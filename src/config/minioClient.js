// config/minioClient.js
const Minio = require('minio');
const env = require('./env');

// Configuração do cliente MinIO
const minioClient = new Minio.Client({
  endPoint: env.MINIO.HOST,
  port: env.MINIO.PORT,
  useSSL: env.MINIO.USE_SSL,
  accessKey: env.MINIO.ACCESS_KEY,
  secretKey: env.MINIO.SECRET_KEY
});

module.exports = minioClient;
