require('module-alias/register'); // Registrar os aliases

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../src/index'); // Importe o app.js
const User = require('@models/User');
const ProfileUser = require('@models/ProfileUser');
const { ROLES } = require('@config/constants');

chai.use(chaiHttp);
const expect = chai.expect;

describe('User Authentication Flow', () => {
  let adminToken;
  let userToken;
  let temporaryPassword;
  let userId;

  before(async () => {
    await User.deleteMany({});
    await ProfileUser.deleteMany({});

    const admin = new User({
      username: 'admin',
      password: 'admin123',
      email: 'admin@test.com',
      role: ROLES.ADMIN,
      isTemporaryPassword: false
    });
    await admin.save();

    const loginRes = await chai.request(app)
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    adminToken = loginRes.body.token;
  });

  it('should create user with temporary password', async () => {
    const res = await chai.request(app)
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: 'newuser',
        email: 'new@test.com'
      });
    
    expect(res).to.have.status(201);
    temporaryPassword = res.body.temporaryPassword;
    
    const user = await User.findOne({ username: 'newuser' });
    expect(user.isTemporaryPassword).to.be.true;
    userId = user._id;
  });

  // ... demais testes
});