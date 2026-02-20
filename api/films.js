// api/films.js
// GET  /api/films         → returns all live films (public)
// POST /api/films         → adds a new film (called by Google Apps Script, requires API_SECRET)

import clientPromise from '../lib/mongodb.js';
import crypto from 'crypto';

const DB_NAME = 'shortsoftheyear';
const COLLECTION = 'films';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const POST_RATE_LIMIT_MAX = 30;
const postRateState = globalThis.__softyFilmsPostRateState || new Map();
globalThis.__softyFilmsPostRateState = postRateState;

function getAllowedOrigins() {
  const fromEnv = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return [
    'https://www.shortsoftheyear.com',
    'https://shortsoftheyear.com',
    'http://localhost:4173',
    'http://localhost:3000'
  ];
}

function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const allowed = getAllowedOrigins();
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-secret');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkPostRateLimit(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = postRateState.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  postRateState.set(ip, entry);
  if (entry.count > POST_RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  return true;
}

function timingSafeEquals(a, b) {
  const aBuf = Buffer.from(String(a || ''));
  const bBuf = Buffer.from(String(b || ''));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function sanitizeForPublic(film) {
  return {
    submissionId: film.submissionId || '',
    timestamp: film.timestamp || '',
    title: film.title || '',
    director: film.director || '',
    writer: film.writer || '',
    producer: film.producer || '',
    genre: film.genre || '',
    runtime: film.runtime || '',
    logline: film.logline || '',
    directorStatement: film.directorStatement || '',
    filmLink: film.filmLink || '',
    twitter: film.twitter || '',
    onlinePremiere: film.onlinePremiere || '',
    cast: film.cast || '',
    language: film.language || '',
    thumbnail: film.thumbnail || '',
    slug: film.slug || '',
    review: film.review || '',
    pending: !!film.pending,
    live: !!film.live,
    accepted: !!film.accepted
  };
}

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
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
      const safe = films.map(sanitizeForPublic);
      return res.status(200).json({ films: safe });
    }

    // ── POST: add a new film (from Google Apps Script) ──────────
    if (req.method === 'POST') {
      if (!checkPostRateLimit(req, res)) return;

      const secret = req.headers['x-api-secret'];
      const expected = process.env.API_SECRET;
      if (!expected || !timingSafeEquals(secret, expected)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const film = req.body;
      if (!film || !film.title || !film.director) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (film.website || film.honeypot) {
        return res.status(400).json({ error: 'Invalid submission' });
      }

      const cleanFilm = { ...film };
      delete cleanFilm.password;
      delete cleanFilm.email;
      delete cleanFilm.website;
      delete cleanFilm.honeypot;
      cleanFilm.timestamp = cleanFilm.timestamp || new Date().toISOString();
      cleanFilm.pending = typeof cleanFilm.pending === 'boolean' ? cleanFilm.pending : true;
      cleanFilm.live = typeof cleanFilm.live === 'boolean' ? cleanFilm.live : false;
      cleanFilm.accepted = typeof cleanFilm.accepted === 'boolean' ? cleanFilm.accepted : false;

      await col.insertOne(cleanFilm);
      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (_) {
    return res.status(500).json({ error: 'Server error' });
  }
}
