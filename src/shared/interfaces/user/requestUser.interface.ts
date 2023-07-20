import { Request } from 'express';
import { UserInterface } from './user.interface';
import { MulterFile, userRole } from '../../types/type';

export interface RequestUserInterface extends Request {
  user?: UserInterface;
  name?: string;
  email?: string;
  role?: userRole;
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt?: string;
}

export interface FilesInterface {
  [fieldName: string]:MulterFile[];
}

