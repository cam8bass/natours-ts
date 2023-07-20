import { NextFunction, Request, Response } from 'express';
import Tour from '../models/tour.model';
import catchAsync from '../utils/catchAsync.util';
import { RequestUserInterface, TourInterface } from '../shared/interfaces';
import AppError from '../utils/error.util';
import User from '../models/user.model';

export const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) get tour data from collection
    const tours = await Tour.find<TourInterface>();
    // 2) build template
    //3) render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours
    });
  }
);

export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1) get data including reviews and guides
    const { slug } = req.params;
    const tour = await Tour.findOne<TourInterface>({ slug }).populate({
      path: 'reviews',
      select: 'review rating user'
    });
    if (!tour) {
      return next(new AppError('There is no tour with that name.', 404));
    }
    // 2) build template
    // 3) render template using data
    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour
    });
  }
);

export const getLoginForm = async (req: Request, res: Response) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

export const getAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

export const updateUserData = catchAsync(
  async (req: RequestUserInterface, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        name: req.body.name,
        email: req.body.email
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).render('account', {
      title: 'Your account',
      user
    });
  }
);
