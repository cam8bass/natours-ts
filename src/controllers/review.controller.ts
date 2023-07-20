import { NextFunction, Response } from 'express';
import Review from '../models/review.model';
import { RequestUserInterface } from '../shared/interfaces';
import * as factory from './factory.controller';

export const setTourUserIds = (
  req: RequestUserInterface,
  res: Response,
  next: NextFunction
) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user?.id;
  next();
};

export const getAllReviews = factory.getAll(Review);
export const deleteReview = factory.deleteOne(Review);
export const updateReview = factory.updateOne(Review);
export const createReview = factory.createOne(Review);
export const getReview = factory.getOne(Review);
