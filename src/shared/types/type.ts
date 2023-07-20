import { UserInterface } from '../interfaces';

export type userRole = 'user' | 'guide' | 'lead-guide' | 'admin';
export type userUpdateBody = keyof Partial<UserInterface>;
export type MulterFile = Express.Multer.File;

