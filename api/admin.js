// api/admin.js
// All routes require x-admin-password header matching ADMIN_PASSWORD env var
//
// GET    /api/admin?action=list            → all films (including hidden)
// POST   /api/admin?action=generateReview  → generate review from full template set
// PUT    /api/admin?action=update&id=xxx   → edit a film
// PUT    /api/admin?action=approve&id=xxx  → approve pending submission + set review
// DELETE /api/admin?action=delete&id=xxx   → delete a film
// PUT    /api/admin?action=toggle&id=xxx   → toggle live/hidden

import clientPromise from '../lib/mongodb.js';
import { generateReview } from '../lib/review-generator.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';

const DB_NAME = 'shortsoftheyear';
const COLLECTION = 'films';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const rateState = globalThis.__softyAdminRateState || new Map();
globalThis.__softyAdminRateState = rateState;

const ALLOWED_UPDATE_FIELDS = new Set([
  'title', 'director', 'writer', 'producer', 'genre', 'runtime',
  'logline', 'directorStatement', 'filmLink', 'thumbnail', 'slug',
  'review', 'twitter', 'onlinePremiere', 'cast', 'language',
  'pending', 'live', 'accepted', 'timestamp'
]);

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req, res) {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateState.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  rateState.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
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

function authCheck(req, res) {
  const pw = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !timingSafeEquals(pw, expected)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function toObjectId(id, res) {
  if (!id || !ObjectId.isValid(String(id))) {
    res.status(400).json({ error: 'Invalid id' });
    return null;
  }
  return new ObjectId(String(id));
}

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!checkRateLimit(req, res)) return;
  if (!authCheck(req, res)) return;

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);
    const { action, id } = req.query;

    // ── LIST all films ──────────────────────────────────────────
    if (req.method === 'GET' && action === 'list') {
      const films = await col.find({}).sort({ timestamp: -1 }).toArray();
      return res.status(200).json({ films });
    }

    if (req.method === 'POST' && action === 'generateReview') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      return res.status(200).json({ review: generateReview(payload) });
    }

    // ── UPDATE a film ───────────────────────────────────────────
    if (req.method === 'PUT' && action === 'update' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const updates = {};
      for (const [k, v] of Object.entries(raw)) {
        if (ALLOWED_UPDATE_FIELDS.has(k)) updates[k] = v;
      }

      await col.updateOne({ _id: oid }, { $set: updates });
      return res.status(200).json({ success: true });
    }

    // ── CREATE a film directly (admin shortcut) ─────────────────
    if (req.method === 'POST' && action === 'create') {
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      if (!raw.title || !raw.director) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const film = {};
      for (const [k, v] of Object.entries(raw)) {
        if (ALLOWED_UPDATE_FIELDS.has(k)) film[k] = v;
      }
      film.timestamp = film.timestamp || new Date().toISOString();
      film.pending = false;
      film.accepted = typeof film.accepted === 'boolean' ? film.accepted : true;
      film.live = typeof film.live === 'boolean' ? film.live : true;

      const insertRes = await col.insertOne(film);
      return res.status(201).json({ success: true, id: String(insertRes.insertedId) });
    }

    // ── APPROVE a pending submission ───────────────────────────
    if (req.method === 'PUT' && action === 'approve' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const review = typeof req.body?.review === 'string' ? req.body.review : '';
      await col.updateOne(
        { _id: oid },
        { $set: { review, pending: false, live: true, accepted: true } }
      );
      return res.status(200).json({ success: true });
    }

    // ── TOGGLE live / hidden ────────────────────────────────────
    if (req.method === 'PUT' && action === 'toggle' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });

      await col.updateOne({ _id: oid }, { $set: { live: !film.live } });
      return res.status(200).json({ success: true, live: !film.live });
    }

    // ── DELETE a film ───────────────────────────────────────────
    if (req.method === 'DELETE' && action === 'delete' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      await col.deleteOne({ _id: oid });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
