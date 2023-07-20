import { Aggregate, Model, Query, Schema, model } from 'mongoose';
import {
  TourAggregateStatsInterface,
  TourInterface
} from '../shared/interfaces';
import slugify from 'slugify';

const tourSchema = new Schema<TourInterface>(
  {
    createdAt: {
      type: Date,
      default: Date.now()
    },
    description: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium, difficult'
      }
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    images: {
      type: [String]
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a groupe size']
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have less or equal then 10 characters'],
      match: [/^[a-zA-Z ]+$/, 'Ce champ doit contenir uniquement des lettres ']
    },
    ratingsAverage: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be above 5.0'],
      default: 4.5,
      set: (val: number): number => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    startDates: {
      type: [String]
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: TourInterface, val: number): boolean {
          // this only points to current doc on NEW DOCUMENT CREATION
          return val < this.price;
        },
        message: 'Discount price should be below the regular price'
      }
    },
    slug: String,
    startLocation: {
      // GeJson
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },

  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeek').get(function () {
  return +(this.duration / 7).toFixed(0);
});

// Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE : runs before .save() and .create()
tourSchema.pre<TourInterface>('save', function (next): void {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// QUERY MIDDLEWARE
tourSchema.pre<Query<TourInterface, TourInterface>>(
  /^find/,
  function (next): void {
    this.find({ secretTour: { $ne: true } });
    next();
  }
);

tourSchema.pre(/^find/, function (this:TourInterface,next) {
  this.populate([
    {
      path: 'guides',
      select: '-__v -passwordChangeAt'
    },
    {
      path: 'reviews',
      select: 'name photo review rating'
    }
  ]);
  next();
});



// AGGREGATION MIDDLEWARE
// tourSchema.pre<Aggregate<TourAggregateStatsInterface>>(
//   'aggregate',
//   function (next): void {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//     next();
//   }
// );

const Tour: Model<TourInterface> = model<TourInterface>('Tour', tourSchema);

export default Tour;
