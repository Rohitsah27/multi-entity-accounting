import dns from 'node:dns';
// Ensure reliable SRV record resolution across all network configurations
dns.setServers(['8.8.8.8', '1.1.1.1']);
// Prefer IPv4 for outbound connections. On dual-stack networks Node can
// resolve/connect over IPv6 by default; if only the IPv4 address is
// whitelisted in Atlas Network Access, an IPv6-routed attempt fails with
// "Could not connect to any servers" even though the IPv4 is allowed.
dns.setDefaultResultOrder('ipv4first');

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / Database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB] Successfully reconnected.');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Failed: ${error.message}`);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error('[MongoDB Hint] Check database username and password in MONGODB_URI.');
    } else if (error.message.includes('querySrv ETIMEOUT') || error.message.includes('ENOTFOUND')) {
      console.error('[MongoDB Hint] Network/DNS error. Ensure your current IP is whitelisted in MongoDB Atlas Network Access.');
    }
    return null;
  }
};

export default connectDB;
