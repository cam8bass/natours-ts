import dotenv from 'dotenv';
import app from './main';
import connectToDB from './shared/services/connectDb.service';
import http from 'http';

let server: http.Server;
dotenv.config({ path: './env/config.env' });
const { DATABASE, DATABASE_PASSWORD, PORT } = process.env;

const databaseUri = DATABASE?.replace('<password>', DATABASE_PASSWORD!);

async function startServer() {
  try {
    await connectToDB(databaseUri!);
    const port = PORT || 3000;
    server = app.listen(port, () => {
      console.log(`✅ Server is listening on port ${port}`);
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('💥 Server startup error:', error);
    } else if (process.env.NODE_ENV === 'production') {
      console.error('💥 Server startup error:', error.name, error.message);
    }

    process.on('unhandledRejection', (err: any) => {
      console.log('unhandled rejection 💥 Shutting down...');
      console.log(err.name, err.message);
      server.close(() => process.exit(1));
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  }
}

startServer();
