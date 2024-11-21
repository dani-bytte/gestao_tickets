require('module-alias/register');
require('dotenv').config();

const argon2 = require('argon2');
const mongoose = require('mongoose');
const User = require('@models/User'); // Ajuste o caminho conforme necessário
const connectToMongoDB = require('@config/mongoConnection'); // Importar a conexão existente

// Função para atualizar a senha
const updatePassword = async (username, newPassword) => {
  try {
    // Conectar ao MongoDB usando a conexão existente
    await connectToMongoDB();

    // Gerar o hash da nova senha
    const hashedPassword = await argon2.hash(newPassword);

    // Atualizar a senha do usuário no banco de dados
    const user = await User.findOneAndUpdate(
      { username },
      { password: hashedPassword, isTemporaryPassword: false },
      { new: true }
    );

    if (!user) {
      console.log('Usuário não encontrado');
      return;
    }

    console.log(`Senha atualizada com sucesso para o usuário: ${username}`);
  } catch (err) {
    console.error('Erro ao atualizar a senha:', err);
  } finally {
    // Fechar a conexão com o MongoDB
    mongoose.connection.close();
  }
};

// Chamar a função de atualização de senha
const username = 'admin'; // Substitua pelo nome de usuário desejado
const newPassword = '%gSyAn#C@2^EiK$79a'; // Substitua pela nova senha desejada
updatePassword(username, newPassword);