import { ObjectId, Document, Model } from 'mongoose';

export interface ReviewInterface extends Document {
  review: string;
  rating: number;
  createdAt: Date;
  tour: ObjectId;
  user: ObjectId;
}

export interface ReviewModel extends Model<ReviewInterface> {
  calcAverageRatings: (tourId: ObjectId) => Promise<any>;
}
