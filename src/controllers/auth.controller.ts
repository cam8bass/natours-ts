import crypto from 'crypto';
import { NextFunction, Response, Request, RequestHandler } from 'express';
import User from './../models/user.model';
import catchAsync from '../utils/catchAsync.util';
import jwt, { JwtPayload } from 'jsonwebtoken';
import AppError from '../utils/error.util';
import { UserInterface, RequestUserInterface } from '../shared/interfaces';
import { ObjectId } from 'mongoose';
import { userRole } from '../shared/types/type';
import Email from '../utils/email.util';

const signToken = (id: ObjectId) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createAndSendToken = (
  user: UserInterface,
  statusCode: number,
  res: Response
) => {
  // Create token
  const token = signToken(user._id);

  // Define cookie
  const cookieExpires = Number(process.env.JWT_COOKIE_EXPIRES_IN!);
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpires * 24 * 60 * 60 * 1000),
    secure: false,
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined!;
  // send response to the client
  return res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

export const signup = catchAsync(
  async (
    req: RequestUserInterface,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt
    });

    const url = `${req.protocol}://${req.get('host')}/me`;

    await new Email(newUser, url).sendWelCome();

    createAndSendToken(newUser, 201, res);
  }
);

export const login = catchAsync(
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | AppError> => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    // 2) Check if user exist && password is correct ( le + permet d'ajouter le mot de pass au retour )
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    } else {
      // 3) Send token
      createAndSendToken(user, 200, res);
    }
  }
);

export const protect = catchAsync(
  async (
    req: RequestUserInterface,
    res: Response,
    next: NextFunction
  ): Promise<void | AppError> => {
    // 1) Getting token and check if exist
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ').at(1);
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in ! Please log in to get access', 401)
      );
    }
    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 3) Check if user still exists
    const currentUser = (await User.findById(decoded.id)) as UserInterface;

    if (!currentUser) {
      return next(
        new AppError(
          'The token belonging to this user does no longer exist',
          401
        )
      );
    }

    // 4) Check if user changed password after the token was issue

    if (currentUser.changedPasswordAfter(decoded.iat!)) {
      return next(
        new AppError('User recently changed password! Please log in again', 401)
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

// Only for render pages
export const isLoggedIn = async (
  req: RequestUserInterface,
  res: Response,
  next: NextFunction
): Promise<void | AppError> => {
  if (req.cookies.jwt) {
    try {
      const token = req.cookies.jwt;

      // 2) Verification token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // 3) Check if user still exists
      const currentUser = (await User.findById(decoded.id)) as UserInterface;

      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the token was issue

      if (currentUser.changedPasswordAfter(decoded.iat!)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

export const logout = catchAsync(
  (req: Request, res: Response, next: NextFunction) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    return res.status(200).json({
      status: 'success'
    });
  }
);

export const restrictTo = (...role: userRole[]): RequestHandler => {
  return (
    req: RequestUserInterface,
    res: Response,
    next: NextFunction
  ): void | AppError => {
    if (!role.includes(req.user?.role!)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1 ) Get user based on Posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address', 404));
    }
    // 2 ) Générate random token
    const resetToken = user?.createPasswordResetToken();
    // Permet d'enregister le token crypté de reset pwd dans la bdd
    await user?.save({ validateBeforeSave: false });
    // 3) Send it to user's email
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    try {
      await new Email(user, resetUrl).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email'
      });
    } catch (error: any) {
      user!.passwordResetToken = undefined!;
      user!.passwordResetExpires = undefined!;
      await user?.save({ validateBeforeSave: false });
      return next(
        new AppError(
          'There was an error sending the email. Please try again later!',
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user: UserInterface | null = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user!.password = req.body.password;
    user!.passwordConfirm = req.body.passwordConfirm;
    user!.passwordResetToken = undefined!;
    user!.passwordResetExpires = undefined!;
    await user?.save();
    // 3) Update changedPasswordAt property for the currentUser

    // 4) Log the user in , send JWT
    createAndSendToken(user, 200, res);
  }
);

export const updatePassword = catchAsync(
  async (req: RequestUserInterface, res: Response, next: NextFunction) => {
    // 1) Get user from collection
    const user = await User.findById(req.user?.id).select('+password');

    // 2) Check if post password is correct

    if (
      !user ||
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong ', 401));
    }

    // 3) UpdatePassword
    user.updatePassword(req.body.password, req.body.passwordConfirm);
    await user.save();
    // 4) Log user in , send JWT
    createAndSendToken(user, 200, res);
  }
);
