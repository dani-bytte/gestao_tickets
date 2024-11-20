const Minio = require('minio');
const logger = require('@config/logger');
const { minioConfig } = require('@config/minioClient');

let minioClient;

const connectToMinio = () => {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });

    logger.info('Conectado ao MinIO');
  }
  return minioClient;
};

const checkLogin = async () => {
  try {
    const client = connectToMinio();
    await client.listBuckets();
    logger.info('Login successful');
    return true;
  } catch (error) {
    logger.error('Login failed:', {
      message: error.message,
      code: error.code
    });
    return false;
  }
};

const initializeBucket = async () => {
  try {
    const loginSuccess = await checkLogin();
    if (!loginSuccess) {
      throw new Error('Login failed, cannot proceed with bucket initialization');
    }

    logger.info('Verificando existência do bucket:', minioConfig.bucketName);
    const client = connectToMinio();
    const exists = await client.bucketExists(minioConfig.bucketName);
    
    if (!exists) {
      logger.info('Criando bucket:', minioConfig.bucketName);
      await client.makeBucket(minioConfig.bucketName, 'us-east-1');
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
};

const getSignedUrl = (fileName) => {
  return new Promise((resolve, reject) => {
    const client = connectToMinio();
    client.presignedGetObject(minioConfig.bucketName, fileName, 24*60*60, (err, presignedUrl) => {
      if (err) return reject(err);
      resolve(presignedUrl);
    });
  });
};

module.exports = { connectToMinio, initializeBucket, getSignedUrl };