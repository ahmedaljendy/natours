const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const multerstorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];

//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); // unique filename
//   },
// });

const multerstorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Please Upload Only Images'), false);
  }
};

const upload = multer({
  storage: multerstorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = async (req, res) => {
  // console.log(req.file);

  // 1) Prevent the update of the password
  if (req.body.password || req.body.passwordConfirm)
    throw new AppError(400, 'this route is not for updating the password');

  // 2) filter the allowed fileds to update
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // 3) update the user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
};

exports.deleteMe = async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
  });
};
exports.createUser = async (req, res) => {};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
