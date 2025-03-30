const path = require('path');
const fs = require('fs');
const { config } = require('dotenv');

// Determinar o ambiente (development, production, test)
const NODE_ENV = process.env.NODE_ENV || 'development';

// Carregar o arquivo .env apropriado
const envPath = path.resolve(process.cwd(), 'env', `.env${NODE_ENV !== 'development' ? `.${NODE_ENV}` : ''}`);

// Verificar se o arquivo .env existe
if (!fs.existsSync(envPath)) {
  console.error(`Arquivo de ambiente não encontrado em ${envPath}`);
  console.error('Crie um arquivo .env baseado no arquivo .env.example');
  process.exit(1);
}

// Carregar variáveis de ambiente do arquivo
const result = config({ path: envPath });

if (result.error) {
  console.error('Erro ao carregar variáveis de ambiente:', result.error);
  process.exit(1);
}

// Variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRATION',
  'MINIO_HOST',
  'MINIO_PORT',
  'MINIO_USE_SSL',
  'MINIO_APP_ACCESS_KEY',
  'MINIO_APP_SECRET_KEY'
];

// Verificar se todas as variáveis obrigatórias estão presentes
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Variáveis de ambiente obrigatórias não encontradas: ${missingEnvVars.join(', ')}`);
  console.error('Atualize seu arquivo .env com as variáveis necessárias');
  process.exit(1);
}

// Exportar todas as variáveis de ambiente como um objeto
module.exports = {
  NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION,
  EMAIL: {
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS
  },
  MINIO: {
    HOST: process.env.MINIO_HOST,
    PORT: Number(process.env.MINIO_PORT),
    USE_SSL: process.env.MINIO_USE_SSL === 'true',
    ACCESS_KEY: process.env.MINIO_APP_ACCESS_KEY,
    SECRET_KEY: process.env.MINIO_APP_SECRET_KEY
  }
};