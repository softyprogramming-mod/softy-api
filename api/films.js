// api/films.js
// GET  /api/films         → returns all live films (public)
// POST /api/films         → adds a new film (called by Google Apps Script, requires API_SECRET)

import clientPromise from '../lib/mongodb.js';

const DB_NAME = 'shortsoftheyear';
const COLLECTION = 'films';

export default async function handler(req, res) {
  // CORS — allow your GitHub Pages domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  // ── GET: return all live films ──────────────────────────────
  if (req.method === 'GET') {
    const films = await col
      .find({ live: true })
      .sort({ timestamp: -1 })
      .toArray();

    // Remove sensitive fields before sending to public
    const safe = films.map(({ _id, email, password, ...rest }) => rest);
    return res.status(200).json({ films: safe });
  }

  // ── POST: add a new film (from Google Apps Script) ──────────
  if (req.method === 'POST') {
    const secret = req.headers['x-api-secret'];
    if (secret !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const film = req.body;
    if (!film || !film.title || !film.director) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    film.timestamp = film.timestamp || new Date().toISOString();
    film.live = true;

    await col.insertOne(film);
    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
