const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const User = require('../models/userModel');

const signToken = function (id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, StatusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.eventNames.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(StatusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 1) check if the email & password exist
  if (!email || !password) {
    throw new AppError(400, 'Please provide an email and a password ');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError(401, 'the email or the password is incorrect');
  }

  createSendToken(user, 200, res);
};

exports.protect = async (req, res, next) => {
  // 1) get the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new AppError(
      401,
      'You are not logged in, Please login to get access ',
    );
  }

  // 2) Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if th euser still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    throw new AppError(401, 'the user is no longer exists');
  }
  // 4) Check if the user changed his password after the token is issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw new AppError(
      401,
      'user recently changed his password, please log in again ',
    );
  }
  req.user = currentUser;
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      throw new AppError(
        403,
        "you don't have permission to perform this action",
      );
    next();
  };

exports.forgotPassword = async (req, res) => {
  // 1) find the user
  const user = await User.findOne({ email: req.body.email });

  if (!user) throw new AppError(404, 'there is no user with that email');

  // 2) Generate the random reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token to user's email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetpassword/${resetToken}`;
  const message = `forget your password ? dubmit a PATCH request with yuor new password amd passwordConfirm to : ${resetURL}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset token',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to mail',
    });
  } catch (err) {
    user.passwordRestToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(500, 'there was an error sending the email');
  }
};

exports.resetPassword = async (req, res) => {
  // 1) Get user based on the token
  const { token } = req.params;
  const encryptedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    passwordRestToken: encryptedToken,
    passwordRestExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(400, 'token is invalid or expired');
  }

  // 2) set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordRestToken = undefined;
  user.passwordRestExpires = undefined;
  await user.save();

  // 3) update passwordChangedAt property for the user
  // in the user model [ pre save hook ]

  // 4) log the user in , send JWT
  createSendToken(user, 201, res);
};

exports.updatePassword = async (req, res, next) => {
  // 1) Get the user
  const user = await User.findById(req.user.id).select('+password');

  // 2) check if the password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    throw new AppError(400, 'the password you entered is wrong');
  }

  // 3) update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log the user in , send JWT
  createSendToken(user, 201, res);
};
