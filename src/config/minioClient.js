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

logger.info('MinIO Config:', {
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL
});

const minioClient = new Minio.Client({
  endPoint: minioConfig.endPoint,
  port: minioConfig.port,
  useSSL: minioConfig.useSSL,
  accessKey: minioConfig.accessKey,
  secretKey: minioConfig.secretKey
});

async function checkLogin() {
  try {
    // Attempt to list buckets as a login check
    await minioClient.listBuckets();
    logger.info('Login successful');
    return true;
  } catch (error) {
    logger.error('Login failed:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
}

async function initializeBucket() {
  try {
    const loginSuccess = await checkLogin();
    if (!loginSuccess) {
      throw new Error('Login failed, cannot proceed with bucket initialization');
    }

    logger.info('Verificando existência do bucket:', minioConfig.bucketName);
    const exists = await minioClient.bucketExists(minioConfig.bucketName);
    
    if (!exists) {
      logger.info('Criando bucket:', minioConfig.bucketName);
      await minioClient.makeBucket(minioConfig.bucketName, 'us-east-1');
      logger.info('Bucket criado com sucesso');
    } else {
      logger.info('Bucket já existe');
    }
  } catch (error) {
    logger.error('Erro na inicialização do MinIO:', {
      message: error.message,
      code: error.code
    });
  }
}

initializeBucket();

function getSignedUrl(fileName) {
  return new Promise((resolve, reject) => {
    minioClient.presignedGetObject(minioConfig.bucketName, fileName, 24*60*60, (err, presignedUrl) => {
      if (err) return reject(err);
      resolve(presignedUrl);
    });
  });
}

module.exports = { minioClient, minioConfig, getSignedUrl };
