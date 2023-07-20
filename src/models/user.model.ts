import { Model, MongooseQueryMiddleware, Schema, model } from 'mongoose';
import { UserInterface } from '../shared/interfaces';
import validator from 'validator';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// 1 ) SCHEMA
const userSchema = new Schema<UserInterface>({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default:"default.jpg"
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE !!!
      validator: function (this: UserInterface, pass: string): boolean {
        return pass === this.password;
      },
      message: 'Password are not the same !'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// 2 ) MIDDLEWARE DOCUMENT
// 2.1) hash du mot de passe et supprésion du champ passwordConfirm
userSchema.pre<UserInterface>('save', async function (next) {
  // Only run this function if password wa actually modified
  if (!this.isModified('password')) {
    return next();
  }
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre<UserInterface>('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  const DateNow = Date.now() - 1000;
  this.passwordChangedAt = new Date(DateNow);
  next();
});

userSchema.pre(/^find/, function (this:Model<UserInterface>,next) {
  // this points to the query
  this.find({ active: { $ne: false } });
  next();
});

// 3) METHOD DOCUMENT
// 3.1) Comparaison du mot de passe fourni dans l'input et le mt de passe contenu dans la Bdd
userSchema.methods.correctPassword = async function (
  inputPassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(inputPassword, userPassword);
};

// 3.2) Vérification si le password a été modifié , si oui, si un token est en cours d'utilisation , il ne sera plus valide.
userSchema.methods.changedPasswordAfter = function (
  this: UserInterface,
  JWTTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp: number = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString(),
      10
    );
    return changedTimestamp > JWTTimestamp;
  }
  // False means not changes
  return false;
};

// 3.3) Mise a en place du Reset password
userSchema.methods.createPasswordResetToken = function (this: UserInterface) {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.updatePassword = function (
  this: UserInterface,
  newPassword: string,
  newPasswordConfirm: string
) {
  this.password = newPassword;
  this.passwordConfirm = newPasswordConfirm;
};

// 4) MODEL
const User :Model<UserInterface>= model<UserInterface>('User', userSchema);

// 5) EXPORT MODEL
export default User;
