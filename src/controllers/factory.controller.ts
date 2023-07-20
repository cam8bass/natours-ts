import { Model, PopulateOptions, Query } from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync.util';
import AppError from '../utils/error.util';
import {
  ReviewInterface,
  TourInterface,
  UserInterface
} from '../shared/interfaces';
import FilterFeatures from '../utils/filter.util';

export const deleteOne = (
  Model: Model<UserInterface> | Model<TourInterface> | Model<ReviewInterface>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id: string = req.params.id;
    const data = await Model.findByIdAndDelete(id);

    if (!data) {
      return next(new AppError(`No Document found with that ID `, 404));
    }

    res.status(201).json({
      status: 'success',
      data: null
    });
  });

export const updateOne = <
  T extends UserInterface | ReviewInterface | TourInterface
>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id: string = req.params.id;

    const data = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!data) {
      return next(new AppError(`No Document found with that ID `, 404));
    }

    res.status(200).json({
      status: 'success',
      data
    });
  });

export const createOne = <
  T extends UserInterface | TourInterface | ReviewInterface
>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const data = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data
    });
  });

export const getOne = <
  T extends UserInterface | TourInterface | ReviewInterface
>(
  Model: Model<T>,
  popOptions?: PopulateOptions
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id: string = req.params.id;
    let query: Query<any, any> = Model.findById(id).select('-__v');

    if (popOptions) query = query.populate(popOptions);

    const data: T = await query;
    if (!data) {
      return next(new AppError(`No Document found with that ID`, 404));
    }

    res.status(200).json({
      status: 'success',
      data
    });
  });

export const getAll = <
  T extends UserInterface | TourInterface | ReviewInterface
>(
  Model: Model<T>
) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // To allow for nested get reviews on tour
    let filter = {};

    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new FilterFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .fields()
      .page();
    const data = await features.query;
    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  });
