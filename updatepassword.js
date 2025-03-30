require('module-alias/register');
const env = require('@config/env');

const argon2 = require('argon2');
const mongoose = require('mongoose');
const User = require('@models/User'); 
const connectToMongoDB = require('@config/mongoConnection');

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
const username = process.argv[2] || 'admin'; // Obtém o username da linha de comando ou usa 'admin'
const newPassword = process.argv[3]; // Obtém a nova senha da linha de comando

if (!newPassword) {
  console.error('Uso: node updatepassword.js <username> <nova_senha>');
  process.exit(1);
}

updatePassword(username, newPassword);