// config/minioClient.js
const Minio = require('minio');
const logger = require('./logger');
require('dotenv').config();

const minioConfig = {
  endPoint: 'minios3.muonityzone.top',
  port: 443, // Use standard HTTPS port
  useSSL: true, // Enable SSL
  accessKey: process.env.MINIO_APP_ACCESS_KEY,
  secretKey: process.env.MINIO_APP_SECRET_KEY,
  bucketName: 'comprovantes'
};

const minioClient = new Minio.Client({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey
});

function getSignedUrl(fileName) {
  return new Promise((resolve, reject) => {
    minioClient.presignedGetObject(minioConfig.bucketName, fileName, 24*60*60, (err, presignedUrl) => {
      if (err) return reject(err);
      resolve(presignedUrl);
    });
  });
}

module.exports = { minioConfig };
