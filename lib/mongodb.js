// lib/mongodb.js
// Reuses the connection across hot-reloaded Vercel functions

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please set the MONGODB_URI environment variable in Vercel');
}

if (process.env.NODE_ENV === 'development') {
  // In dev, use a global so the connection persists across HMR reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
