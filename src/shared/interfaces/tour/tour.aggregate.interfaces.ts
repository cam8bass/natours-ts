import { Document } from 'mongoose';

export interface TourAggregateStatsInterface extends Document {
  _id: string;
  totalTours: number;
  avgRatings: number;
  totalRating: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  minDuration: number;
  maxDuration: number;
}

export interface TourGetMonthlyPlanInterface extends Document {
  month: number;
  totalMonthTours: number;
  tours: [string];
  totalRevenue: number;
}
