import mongoose from 'mongoose';

async function connectToDB(databaseUri: string): Promise<void> {
  try {
    await mongoose.connect(databaseUri);
    console.log('✅ Database connected');
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Database connection error:', error);
    } else if (process.env.NODE_ENV === 'production') {
      console.error('💥 Database connection error:', error.name, error.message);
    }
    process.exit(1);
  }
}

export default connectToDB;
