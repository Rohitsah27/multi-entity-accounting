import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load environment variables from server/.env if present, otherwise process.env
dotenv.config({ path: path.join(__dirname, 'server', '.env') });
dotenv.config();

// Launch the backend server after environment variables are loaded
await import('./server/server.js');
