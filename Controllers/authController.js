const authService = require('../Services/authService');
const { successResponse } = require('../utils/httpResponse');
const PhoneCodes = require('../config/phoneCodes');
const signup = async (req, res, next) => {
  try {
    const { country_code, phone } = req.body;
    // check if the phone is a vaild phone number, in the PhoneCodes array, if not throw an error
    const result = await authService.signup(country_code, phone);
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
},


const login = async (req, res, next) => {
  try {
    const {phone, password} = req.body;

    const result = await authService.login(phone, password);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
},


const me = async (req, res, next) => {
  try {
    const { id } = req.user;

    const user = await authService.me(id);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    successResponse(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, updateProfile };
