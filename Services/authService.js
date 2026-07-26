const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../Models');
const { ApiErrors } = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const SALT_ROUNDS = process.env.SALT_ROUNDS || 12;

async function signup(country_code, phone) {
  // check if the user is registered 
  // send an otp to start verfing the user
  // and create the user temp till he continue the registeration
}

async function createPassword ( phone, password, confirmPassword ) {
  // check if the user is registered 
  // confirm the password matching the schema we have like atleast 8 characters, one uppercase letter, one lowercase letter, one number and one special character
  // hash the password and save the user
  // and send a token to the user so he can continue the registeration
}


async function login( phone, password ) {
  // check if the user is registered 
  // check if the password is correct
  // send a token to the user
}

async function me(id) {
  const found = await User.findByPk(id);
  if (!found) {
    throw ApiErrors.notFound('User not found');
  }
  return {
    id: found.id,
    phone: found.phone,
    name: found.name,
    role: found.role,
  };
}

async function updateProfile(userId, data) {
  // check if the user is registered 
  // check if the password is correct
  // update the user
}

module.exports = { signup, login, me, updateProfile };
