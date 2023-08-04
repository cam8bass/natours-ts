import helmet from 'helmet';
import path from 'path';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import express, { Application } from 'express';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import toursRouter from './routes/tour.routes';
import viewRouter from './routes/view.routes';
import AppError from './utils/error.util';
import globalErrorHandler from './controllers/error.controller';
import usersRouter from './routes/user.routes';
import reviewsRouter from './routes/review.routes';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from "cors"

const app: Application = express();
app.enable('trust proxy');
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARE
// Implement CORS 
app.use(cors())
app.options("*",cors())
// Set security HTTP headers


// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'", "'unsafe-eval'", "https://api.mapbox.com"],
//         styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com"],
//         imgSrc: ["'self'", "data:", "blob:"],
//         connectSrc: ["'self'", "https://api.mapbox.com/mapbox-gl-js/v2.9.1"],
//         fontSrc: ["'self'", "https://fonts.googleapis.com"],
//         objectSrc: ["'none'"],
//       },
//     }
//   })
// );

// Serving static files
app.use(express.static(path.join('public')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limits requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour'
});
app.use('/api', limiter);
// Body parser , reading data from body into req.body
app.use(
  express.json({
    limit: '10kb'
  })
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanatization against NoSql query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());
// 2) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// 3) ERROR HANDLER
app.use(globalErrorHandler);
export default app;
