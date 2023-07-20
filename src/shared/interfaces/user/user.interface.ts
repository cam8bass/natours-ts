import { Document } from 'mongoose';

import { userRole } from '../../types/type';

export interface UserInterface extends Document {
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm: string | undefined;
  passwordChangedAt: Date;
  role: userRole;
  passwordResetToken: string;
  passwordResetExpires: number;
  active: boolean;
  correctPassword: (inputPassword: string, userPassword: string) => Promise<boolean>;
  changedPasswordAfter: (JWTTimestamp: number) => boolean;
  createPasswordResetToken: () => void;
  updatePassword: (newPassword: string, newPasswordConfirm: string) => void;
}


