import { Document, ObjectId } from 'mongoose';

export interface TourInterface extends Document {
  name: string;
  createdAt: Date;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  summary: string;
  description: string;
  imageCover: string;
  images: [string];
  startDates: [string];
  priceDiscount: number;
  durationWeek: number;
  slug: string;
  secretTour?: boolean;
  startLocation: {
    type: string;
    coordinates: number[];
    address: string;
    description: string;
  };
  locations: [
    {
      type: string;
      coordinates: number[];
      address: string;
      description: string;
      day: number;
    }
  ];
  guides: [ObjectId];
}
