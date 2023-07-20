import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync.util';
import User from '../models/user.model';
import { RequestUserInterface, UserInterface } from '../shared/interfaces';
import AppError from '../utils/error.util';
import { userUpdateBody } from '../shared/types/type';
import * as factory from './factory.controller';
import multer from 'multer';
import sharp from 'sharp';

const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  fileFilter(req, file, callback) {
    if (file.mimetype.startsWith('image')) {
      callback(null, true);
    } else {
      callback(new AppError('please upload only images.', 400) as any, false);
    }
  }
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = catchAsync(
  async (req: RequestUserInterface, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    req.file.filename = `user-${req.user?._id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  }
);

// ADMIN

export const getAllUsers = factory.getAll(User);

export const getUser = factory.getOne(User);
// do not update password with this
export const updateUser = factory.updateOne(User);

export const deleteUser = factory.deleteOne(User);

// USER

const filterObj = (
  requestBody: Partial<UserInterface>,
  ...fields: userUpdateBody[]
): Partial<UserInterface> => {
  const newObj: Partial<UserInterface> = {};
  Object.keys(requestBody).forEach((el) => {
    const key = el as userUpdateBody;
    if (fields.includes(key)) {
      newObj[key] = requestBody[key];
    }
  });
  return newObj;
};

export const updateCurrentUser = catchAsync(
  async (req: RequestUserInterface, res: Response, next: NextFunction) => {
    // 1) Create erreur if user Post password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password update, please use /updateMyPassword',
          400
        )
      );
    }

    // 2) Filtered out unwanted fields name that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    // Add photo for user
    if (req.file) filteredBody.photo = req.file.filename;

    // 3) Update user document
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      filteredBody,

      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  }
);

export const deleteCurrentUser = catchAsync(
  async (req: RequestUserInterface, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user?.id, {
      active: false
    });
    res.status(204).json({
      status: 'success',
      data: null
    });
  }
);

export const getCurrentUser = (
  req: RequestUserInterface,
  res: Response,
  next: NextFunction
) => {
  req.params.id = req.user?.id;
  next();
};
