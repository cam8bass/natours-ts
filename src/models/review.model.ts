import { FilterQuery, Model, ObjectId, Schema, model } from 'mongoose';
import { ReviewInterface, ReviewModel } from '../shared/interfaces';
import Tour from './tour.model';

const reviewSchema = new Schema<ReviewInterface>(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour']
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (this:ReviewInterface,next) {
  this.populate(
    {
      path: 'user',
      select: 'name photo'
    }
  );
  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId: ObjectId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId
      }
    },
    {
      $group: {
        _id: '$tour',
        nbrRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nbrRatings
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

reviewSchema.post('save', async function () {
  const reviewModel = this.constructor as ReviewModel;
  reviewModel.calcAverageRatings(this.tour);
});

reviewSchema.pre<FilterQuery<ReviewInterface>>(
  /^findOneAnd/,
  async function (next) {
    const query = this as Model<ReviewInterface>;
    this.r = await query.findOne();
    next();
  }
);

reviewSchema.post<FilterQuery<ReviewInterface>>(
  /^findOneAnd/,
  async function () {
    const reviewModel = this.r.constructor as ReviewModel;
    await reviewModel.calcAverageRatings(this.r.tour);
  }
);

const Review: Model<ReviewInterface> = model<ReviewInterface>(
  'Review',
  reviewSchema
);

export default Review;
