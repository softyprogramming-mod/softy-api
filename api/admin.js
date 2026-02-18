// api/admin.js
// All routes require x-admin-password header matching ADMIN_PASSWORD env var
//
// GET    /api/admin?action=list            → all films (including hidden)
// PUT    /api/admin?action=update&id=xxx   → edit a film
// DELETE /api/admin?action=delete&id=xxx   → delete a film
// PUT    /api/admin?action=toggle&id=xxx   → toggle live/hidden

import clientPromise from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

const DB_NAME = 'shortsoftheyear';
const COLLECTION = 'films';

function authCheck(req, res) {
  const pw = req.headers['x-admin-password'];
  if (pw !== process.env.ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.shortsoftheyear.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!authCheck(req, res)) return;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  const { action, id } = req.query;

  // ── LIST all films ──────────────────────────────────────────
  if (req.method === 'GET' && action === 'list') {
    const films = await col.find({}).sort({ timestamp: -1 }).toArray();
    return res.status(200).json({ films });
  }

  // ── UPDATE a film ───────────────────────────────────────────
  if (req.method === 'PUT' && action === 'update' && id) {
    const updates = req.body;
    // Don't allow overwriting _id
    delete updates._id;

    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );
    return res.status(200).json({ success: true });
  }

  // ── TOGGLE live / hidden ────────────────────────────────────
  if (req.method === 'PUT' && action === 'toggle' && id) {
    const film = await col.findOne({ _id: new ObjectId(id) });
    if (!film) return res.status(404).json({ error: 'Not found' });

    await col.updateOne(
      { _id: new ObjectId(id) },
      { $set: { live: !film.live } }
    );
    return res.status(200).json({ success: true, live: !film.live });
  }

  // ── DELETE a film ───────────────────────────────────────────
  if (req.method === 'DELETE' && action === 'delete' && id) {
    await col.deleteOne({ _id: new ObjectId(id) });
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
