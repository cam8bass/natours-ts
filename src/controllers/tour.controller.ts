import {
  FilesInterface,
  RequestUserInterface,
  TourAggregateStatsInterface,
  TourGetMonthlyPlanInterface
} from './../shared/interfaces/index';
import Tour from './../models/tour.model';
import { Request, Response, NextFunction } from 'express';
import catchAsync from './../utils/catchAsync.util';
import * as factory from './factory.controller';
import AppError from '../utils/error.util';
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

export const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

export const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files: FilesInterface = req.files as FilesInterface;
    const idTour = req.params.id;

    if (!files.imageCover || !files.images) return next();
    req.body.imageCover = `tour-${idTour}-${Date.now()}-cover.jpeg`;
    // 1) Cover image
    await sharp(files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
    // Permet d'enregister l'image dans le body

    // 2) Images
    req.body.images = [];

    await Promise.all(
      files.images.map(async (file, i) => {
        const filename = `tour-${idTour}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
      })
    );

    next();
  }
);

export const updateTour = factory.updateOne(Tour);
export const createTour = factory.createOne(Tour);
export const deleteTour = factory.deleteOne(Tour);

export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, {
  path: 'reviews'
});

export const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = (await Tour.aggregate([
      {
        $match: {
          ratingsAverage: { $gte: 4.6 }
        }
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          totalTours: { $sum: 1 },
          avgRatings: { $avg: '$ratingsAverage' },
          totalRating: { $sum: '$ratingsQuantity' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          minDuration: { $min: '$duration' },
          maxDuration: { $max: '$duration' }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
    ])) as TourAggregateStatsInterface[];

    res.status(200).json({
      status: 'success',
      results: stats.length,
      data: {
        stats
      }
    });
  }
);

export const getMonthlyPlan = catchAsync(
  async (req: Request<{ year: string }>, res: Response, next: NextFunction) => {
    const year = req.params.year;
    const monthlyPlan = (await Tour.aggregate([
      {
        $unwind: '$startDates'
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          totalMonthTours: { $sum: 1 },
          tours: { $push: '$name' },
          totalRevenue: { $sum: '$price' }
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: { _id: 0 }
      },
      {
        $sort: { month: 1 }
      }
    ])) as TourGetMonthlyPlanInterface[];
    res.status(200).json({
      status: 'success',
      results: monthlyPlan.length,
      data: {
        monthlyPlan
      }
    });
  }
);

export const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { distance, latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    const radius =
      unit === 'mi' ? Number(distance) / 3963.2 : Number(distance) / 6378.1;

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng',
          404
        )
      );
    }

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius]
        }
      }
    });
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  }
);

export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { latlng, unit } = req.params;

    const [lat, lng] = latlng.split(',');

    if (!lat || !lng) {
      return next(
        new AppError(
          'Please provide latitude and longitude in the format lat,lng',
          404
        )
      );
    }

    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    const distance = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier
        }
      },
      {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        distance
      }
    });
  }
);
