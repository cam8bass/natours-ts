import { NextFunction, Request, Response } from 'express';
import AppError from './../utils/error.util';
import { AppErrorInterface } from '../shared/interfaces';

// 1) Traitement des différents type d'erreur
const handleCastErrorDB = (err: any): AppErrorInterface => {
  const message: string = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any): AppErrorInterface => {
  const value = err.message.match(/(["'])(\\?.)*?\1/)?.at(0) as string;
  const message: string = `Duplicate field value: ${value} Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any): AppErrorInterface => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message: string = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// 2 ) Error Token
const handleJwtError = (): AppErrorInterface =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJwtExpiredError = (): AppErrorInterface =>
  new AppError('Your token has expired! Please login again', 401);

// 3) Configuration de l'affichage des erreurs en fonction du mode development|production
const sendErrorDev = (err: any, req: Request, res: Response) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // B) RENDERED WEBSITE
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err: any, req: Request, res: Response) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    // 1) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }

  // B) RENDERED WEBSITE
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }

  // 1) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!'
  });
};

// 4) MIDDLEWARE ERROR
export default (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error= err;
    let error = { ...err }; // a voir
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    if (error.name === 'JsonWebTokenError') error = handleJwtError();

    if (error.name === 'TokenExpiredError') error = handleJwtExpiredError();

    sendErrorProd(error, req, res);
  }
};
