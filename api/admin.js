// api/admin.js
// All routes require x-admin-password header matching ADMIN_PASSWORD env var
//
// GET    /api/admin?action=list            → all films (including hidden)
// POST   /api/admin?action=generateReview  → generate review from full template set
// POST   /api/admin?action=reorder         → reorder accepted films (top = hero)
// PUT    /api/admin?action=update&id=xxx   → edit a film
// PUT    /api/admin?action=approve&id=xxx  → approve pending submission + set review
// POST   /api/admin?action=sendAcceptanceEmail&id=xxx → resend acceptance email
// GET    /api/admin?action=instagramPreview&id=xxx → preview Instagram caption/image
// POST   /api/admin?action=postInstagram&id=xxx → publish film post to Instagram
// DELETE /api/admin?action=reject&id=xxx   → reject pending submission + send rejection email
// DELETE /api/admin?action=delete&id=xxx   → delete a film
// PUT    /api/admin?action=toggle&id=xxx   → toggle live/hidden

import clientPromise from '../lib/mongodb.js';
import { generateReview } from '../lib/review-generator.js';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import sharp from 'sharp';

const DB_NAME = 'shortsoftheyear';
const COLLECTION = 'films';
const SETTINGS_COLLECTION = 'adminSettings';
const REJECTION_ARC_DOC_ID = 'rejectionArc';
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 120;
const rateState = globalThis.__softyAdminRateState || new Map();
globalThis.__softyAdminRateState = rateState;

const ALLOWED_UPDATE_FIELDS = new Set([
  'title', 'director', 'writer', 'producer', 'genre', 'runtime',
  'logline', 'directorStatement', 'filmLink', 'thumbnail', 'slug',
  'review', 'twitter', 'onlinePremiere', 'completionDate', 'cast', 'language',
  'pending', 'live', 'accepted', 'timestamp', 'sortOrder',
  'autoPaused', 'autoPausedAt', 'autoPauseRemainingMs', 'scheduledDecisionAt',
  'autoResumedAt', 'instagramPostedAt', 'instagramPostId', 'instagramPostCaption',
  'instagramPostImageUrl', 'instagramSourceImageUrl'
]);

const ARC_DELAY_UNITS = new Set(['minutes', 'hours', 'days']);
const ARC_STEP_TYPES = new Set(['custom', 'acceptance_builtin']);

function defaultRejectionArcConfig() {
  return {
    enabled: false,
    steps: [
      {
        id: 'step_1',
        name: 'Email 1',
        senderName: 'The SoftY Jury',
        subject: 'Your submission to Shorts of the Year',
        body: '',
        delayAmount: 0,
        delayUnit: 'hours',
        enabled: true
      }
    ],
    updatedAt: null
  };
}

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.round(n);
  return Math.min(max, Math.max(min, i));
}

function cleanText(value, maxLen = 1000) {
  return String(value == null ? '' : value).replace(/\r\n/g, '\n').slice(0, maxLen);
}

function normalizeInstagramHandle(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const first = raw.split(/[,\s]+/).find(Boolean) || '';
  if (!first) return '';
  if (/^https?:\/\//i.test(first)) {
    try {
      const parsed = new URL(first);
      if (/instagram\.com$/i.test(parsed.hostname.replace(/^www\./i, ''))) {
        const segment = parsed.pathname.split('/').filter(Boolean)[0] || '';
        return segment ? '@' + segment.replace(/^@+/, '') : '';
      }
    } catch (_) {}
  }
  return '@' + first.replace(/^@+/, '').replace(/[^A-Za-z0-9._]/g, '');
}

function getPublicSiteUrl() {
  return String(process.env.PUBLIC_SITE_URL || 'https://www.shortsoftheyear.com').replace(/\/+$/, '');
}

function slugifyForPath(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'film';
}

function buildInstagramCaption(film, overrideCaption = '') {
  const override = cleanText(overrideCaption, 2200).trim();
  if (override) return override;

  const review = cleanText(film?.review || '', 1600).trim();
  const title = cleanText(film?.title || 'Untitled', 180).trim();
  const director = cleanText(film?.director || 'the filmmaker', 180).trim();
  const handle = normalizeInstagramHandle(film?.instagram || film?.twitter || '');
  const credit = `${title} by ${director}${handle ? ` (${handle})` : ''}`;
  const caption = [
    review || credit,
    review ? credit : '',
    'Now playing on ShortsOfTheYear.com'
  ].filter(Boolean).join('\n\n');

  return cleanText(caption, 2200).trim();
}

function getInstagramImageUrl(film) {
  const url = String(film?.thumbnail || '').trim();
  if (!url || !/^https:\/\//i.test(url)) return '';
  if (/\/placeholder\.jpe?g(?:$|\?)/i.test(url)) return '';
  return url;
}

function getMetaGraphBase() {
  const version = String(process.env.META_GRAPH_VERSION || 'v25.0').replace(/^\/+|\/+$/g, '');
  return `https://graph.facebook.com/${version}`;
}

function getGithubImageConfig() {
  const token = String(process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '').trim();
  const repo = String(
    process.env.INSTAGRAM_IMAGE_REPO ||
    process.env.GITHUB_IMAGE_REPO ||
    'softyprogramming-mod/Shorts-of-the-Year-website'
  ).trim();
  const branch = String(process.env.INSTAGRAM_IMAGE_BRANCH || process.env.GITHUB_IMAGE_BRANCH || 'main').trim();
  const laurelUrl = String(
    process.env.SOFTY_LAUREL_WHITE_URL ||
    `https://raw.githubusercontent.com/${repo}/${branch}/images/softy-laurel-white.png`
  ).trim();

  if (!token) {
    return {
      ok: false,
      error: 'Laurel image generation needs GITHUB_TOKEN or GITHUB_PAT set in Vercel.'
    };
  }
  if (!/^[^/]+\/[^/]+$/.test(repo)) {
    return { ok: false, error: 'INSTAGRAM_IMAGE_REPO must look like owner/repo.' };
  }
  return { ok: true, token, repo, branch, laurelUrl };
}

function getMetaConfig() {
  const accessToken = String(process.env.META_ACCESS_TOKEN || '').trim();
  const igUserId = String(process.env.META_IG_USER_ID || '').trim();
  if (!accessToken || !igUserId) {
    return {
      ok: false,
      error: 'Instagram posting is not configured. Set META_ACCESS_TOKEN and META_IG_USER_ID in Vercel.'
    };
  }
  return { ok: true, accessToken, igUserId };
}

async function readMetaJson(metaRes) {
  let data = null;
  try { data = await metaRes.json(); } catch (_) {}
  if (!metaRes.ok || data?.error) {
    const metaMessage = data?.error?.message || data?.error?.error_user_msg || `Meta API failed with HTTP ${metaRes.status}`;
    const err = new Error(metaMessage);
    err.status = metaRes.status || 502;
    err.meta = data?.error || data || null;
    throw err;
  }
  return data || {};
}

async function publishInstagramImage({ imageUrl, caption }) {
  const config = getMetaConfig();
  if (!config.ok) {
    const err = new Error(config.error);
    err.status = 500;
    throw err;
  }

  const createBody = new URLSearchParams();
  createBody.set('image_url', imageUrl);
  createBody.set('caption', caption);
  createBody.set('access_token', config.accessToken);

  const createRes = await fetch(`${getMetaGraphBase()}/${encodeURIComponent(config.igUserId)}/media`, {
    method: 'POST',
    body: createBody
  });
  const createData = await readMetaJson(createRes);
  const creationId = String(createData.id || '');
  if (!creationId) {
    const err = new Error('Meta did not return an Instagram creation id.');
    err.status = 502;
    throw err;
  }

  const publishBody = new URLSearchParams();
  publishBody.set('creation_id', creationId);
  publishBody.set('access_token', config.accessToken);

  const publishRes = await fetch(`${getMetaGraphBase()}/${encodeURIComponent(config.igUserId)}/media_publish`, {
    method: 'POST',
    body: publishBody
  });
  const publishData = await readMetaJson(publishRes);
  return {
    creationId,
    postId: String(publishData.id || '')
  };
}

async function fetchImageBuffer(url, label) {
  const imageRes = await fetch(url);
  if (!imageRes.ok) {
    const err = new Error(`Could not download ${label || 'image'} (${imageRes.status})`);
    err.status = 502;
    throw err;
  }
  const contentType = String(imageRes.headers.get('content-type') || '').toLowerCase();
  if (contentType && !contentType.startsWith('image/')) {
    const err = new Error(`${label || 'Image'} URL did not return an image`);
    err.status = 400;
    throw err;
  }
  return Buffer.from(await imageRes.arrayBuffer());
}

async function createLaurelPostImageBuffer(sourceImageUrl, laurelUrl) {
  const [sourceBuffer, laurelBuffer] = await Promise.all([
    fetchImageBuffer(sourceImageUrl, 'film thumbnail'),
    fetchImageBuffer(laurelUrl, 'white laurel')
  ]);

  const size = 1080;
  const base = await sharp(sourceBuffer)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 0.9 })
    .png()
    .toBuffer();

  const laurelSize = Math.round(size * 0.42);
  const laurel = await sharp(laurelBuffer)
    .resize(laurelSize, laurelSize, { fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: '#000000'
    }
  })
    .composite([
      { input: base, left: 0, top: 0 },
      { input: laurel, left: Math.round((size - laurelSize) / 2), top: Math.round(size * 0.07) }
    ])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

async function uploadInstagramImageToGithub({ film, imageBuffer }) {
  const config = getGithubImageConfig();
  if (!config.ok) {
    const err = new Error(config.error);
    err.status = 500;
    throw err;
  }

  const slug = slugifyForPath(film?.slug || film?.title);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `instagram-posts/${slug}-${stamp}.jpg`;
  const putRes = await fetch(`https://api.github.com/repos/${config.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${config.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'softy-api'
    },
    body: JSON.stringify({
      message: `Add Instagram post image for ${film?.title || 'film'}`,
      content: imageBuffer.toString('base64'),
      branch: config.branch
    })
  });

  let data = null;
  try { data = await putRes.json(); } catch (_) {}
  if (!putRes.ok) {
    const err = new Error(data?.message || `GitHub image upload failed with HTTP ${putRes.status}`);
    err.status = putRes.status || 502;
    throw err;
  }

  return `https://raw.githubusercontent.com/${config.repo}/${config.branch}/${path}`;
}

async function createAndUploadLaurelPostImage(film, sourceImageUrl) {
  const config = getGithubImageConfig();
  if (!config.ok) {
    const err = new Error(config.error);
    err.status = 500;
    throw err;
  }
  const imageBuffer = await createLaurelPostImageBuffer(sourceImageUrl, config.laurelUrl);
  return uploadInstagramImageToGithub({ film, imageBuffer });
}

function normalizeRejectionArcStep(raw, index) {
  const step = raw && typeof raw === 'object' ? raw : {};
  const id = cleanText(step.id || `step_${index + 1}`, 64).trim() || `step_${index + 1}`;
  const name = cleanText(step.name || `Email ${index + 1}`, 80).trim() || `Email ${index + 1}`;
  const senderName = cleanText(step.senderName || 'Shorts of the Year', 140).trim();
  const subject = cleanText(step.subject || '', 300).trim();
  const body = cleanText(step.body || '', 20000);
  const delayAmount = clampInt(step.delayAmount, 0, 0, 10000);
  const delayUnit = ARC_DELAY_UNITS.has(String(step.delayUnit || '').toLowerCase())
    ? String(step.delayUnit).toLowerCase()
    : 'hours';
  const enabled = step.enabled !== false;
  const stepType = ARC_STEP_TYPES.has(String(step.stepType || '').toLowerCase())
    ? String(step.stepType).toLowerCase()
    : 'custom';
  const triggerAcceptanceFollowup = stepType === 'acceptance_builtin'
    ? true
    : step.triggerAcceptanceFollowup === true;

  return {
    id,
    name,
    senderName,
    subject,
    body,
    delayAmount,
    delayUnit,
    enabled,
    stepType,
    triggerAcceptanceFollowup
  };
}

function normalizeRejectionArcConfig(raw, options = {}) {
  const incoming = raw && typeof raw === 'object' ? raw : {};
  const stepsRaw = Array.isArray(incoming.steps) ? incoming.steps : [];
  const steps = stepsRaw
    .map((step, idx) => normalizeRejectionArcStep(step, idx))
    .filter(Boolean)
    .slice(0, 25);

  const unique = [];
  const seen = new Set();
  steps.forEach((step, idx) => {
    let id = step.id || `step_${idx + 1}`;
    if (seen.has(id)) {
      let n = 2;
      while (seen.has(`${id}_${n}`)) n += 1;
      id = `${id}_${n}`;
    }
    seen.add(id);
    unique.push({ ...step, id });
  });

  return {
    enabled: incoming.enabled !== false,
    steps: unique.length ? unique : defaultRejectionArcConfig().steps,
    updatedAt: options.preserveUpdatedAt ? (incoming.updatedAt || null) : new Date().toISOString()
  };
}

function hasNumericSortOrder(film) {
  return Number.isFinite(film && film.sortOrder);
}

function compareFilmsForAdmin(a, b) {
  const aHas = hasNumericSortOrder(a);
  const bHas = hasNumericSortOrder(b);
  if (aHas && bHas && a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (aHas !== bHas) return aHas ? -1 : 1;
  const aTime = a && a.timestamp ? new Date(a.timestamp).getTime() : 0;
  const bTime = b && b.timestamp ? new Date(b.timestamp).getTime() : 0;
  return bTime - aTime;
}

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

async function callAppsScriptWebhook(payload) {
  const url = String(process.env.APPS_SCRIPT_WEBHOOK_URL || '').trim();
  if (!url) {
    return { ok: false, status: 500, error: 'APPS_SCRIPT_WEBHOOK_URL not configured' };
  }

  const secret = String(process.env.APPS_SCRIPT_WEBHOOK_SECRET || process.env.ADMIN_PASSWORD || '').trim();
  if (!secret) {
    return { ok: false, status: 500, error: 'APPS_SCRIPT_WEBHOOK_SECRET not configured' };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...(payload || {}), secret })
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || (data && data.success === false)) {
    return {
      ok: false,
      status: res.status,
      error: (data && data.error) || ('Webhook failed with HTTP ' + res.status)
    };
  }
  return { ok: true, status: res.status, data };
}

async function callAppsScriptRejectWebhook(submissionId) {
  return callAppsScriptWebhook({
    action: 'manualReject',
    submissionId
  });
}

async function callAppsScriptApproveWebhook(film, review) {
  return callAppsScriptWebhook({
    action: 'manualApprove',
    submissionId: film.submissionId || '',
    review,
    film: {
      title: film.title || '',
      director: film.director || '',
      writer: film.writer || '',
      producer: film.producer || '',
      genre: film.genre || '',
      runtime: film.runtime || '',
      logline: film.logline || '',
      directorStatement: film.directorStatement || '',
      email: film.email || '',
      filmLink: film.filmLink || '',
      twitter: film.twitter || '',
      onlinePremiere: film.onlinePremiere || '',
      completionDate: film.completionDate || '',
      cast: film.cast || '',
      language: film.language || '',
      slug: film.slug || ''
    }
  });
}

async function callAppsScriptPauseWebhook(submissionId, scheduledDecisionAt) {
  return callAppsScriptWebhook({
    action: 'pauseSubmission',
    submissionId,
    scheduledDecisionAt: scheduledDecisionAt || ''
  });
}

async function callAppsScriptResumeWebhook(submissionId) {
  return callAppsScriptWebhook({
    action: 'resumeSubmission',
    submissionId
  });
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
    const settingsCol = db.collection(SETTINGS_COLLECTION);
    const { action, id } = req.query;

    // ── LIST all films ──────────────────────────────────────────
    if (req.method === 'GET' && action === 'list') {
      const films = (await col.find({}).toArray()).sort(compareFilmsForAdmin);
      return res.status(200).json({ films });
    }

    if (req.method === 'POST' && action === 'generateReview') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      return res.status(200).json({ review: generateReview(payload) });
    }

    if (req.method === 'GET' && action === 'rejectionArc') {
      const doc = await settingsCol.findOne({ _id: REJECTION_ARC_DOC_ID });
      const config = doc && typeof doc === 'object'
        ? normalizeRejectionArcConfig(doc, { preserveUpdatedAt: true })
        : defaultRejectionArcConfig();
      return res.status(200).json({ config });
    }

    if (req.method === 'PUT' && action === 'rejectionArc') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const config = normalizeRejectionArcConfig(payload);
      await settingsCol.updateOne(
        { _id: REJECTION_ARC_DOC_ID },
        { $set: { ...config } },
        { upsert: true }
      );
      return res.status(200).json({ success: true, config });
    }

    if (req.method === 'GET' && action === 'rejectionArcTracker') {
      const webhook = await callAppsScriptWebhook({ action: 'arcTracker' });
      if (!webhook.ok) {
        return res.status(webhook.status || 502).json({ error: webhook.error || 'Arc tracker webhook failed' });
      }
      return res.status(200).json({ arcs: (webhook.data && webhook.data.arcs) || [] });
    }

    if (req.method === 'POST' && action === 'rejectionArcAdvance') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const arcId = String(payload.arcId || '').trim();
      if (!arcId) {
        return res.status(400).json({ error: 'Missing arcId' });
      }
      const webhook = await callAppsScriptWebhook({ action: 'arcAdvance', arcId });
      if (!webhook.ok) {
        return res.status(webhook.status || 502).json({ error: webhook.error || 'Arc advance webhook failed' });
      }
      if (webhook.data && webhook.data.success === false) {
        return res.status(400).json({ error: webhook.data.error || 'Arc advance failed' });
      }
      return res.status(200).json({ success: true, result: webhook.data || {} });
    }

    if (req.method === 'POST' && action === 'rejectionArcCancel') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const arcId = String(payload.arcId || '').trim();
      if (!arcId) {
        return res.status(400).json({ error: 'Missing arcId' });
      }
      const webhook = await callAppsScriptWebhook({ action: 'arcCancel', arcId });
      if (!webhook.ok) {
        return res.status(webhook.status || 502).json({ error: webhook.error || 'Arc cancel webhook failed' });
      }
      if (webhook.data && webhook.data.success === false) {
        return res.status(400).json({ error: webhook.data.error || 'Arc cancel failed' });
      }
      const canceledSubmissionId = String(webhook.data?.submissionId || '').trim();
      if (canceledSubmissionId) {
        await col.updateMany(
          { submissionId: canceledSubmissionId, pending: true },
          {
            $set: { rejectionArcActive: false, rejectionArcCanceledAt: new Date().toISOString() },
            $unset: { rejectionArcId: '' }
          }
        );
      }
      return res.status(200).json({ success: true, result: webhook.data || {} });
    }

    if (req.method === 'POST' && action === 'pauseSubmission' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (film.pending !== true) {
        return res.status(400).json({ error: 'Only pending submissions can be paused' });
      }
      if (film.autoPaused === true) {
        return res.status(200).json({ success: true, alreadyPaused: true, film });
      }
      const submissionId = String(film.submissionId || '').trim();
      if (!submissionId) {
        return res.status(400).json({ error: 'Missing submissionId on pending record' });
      }

      const webhook = await callAppsScriptPauseWebhook(submissionId, film.scheduledDecisionAt || '');
      if (!webhook.ok || (webhook.data && webhook.data.success === false)) {
        return res.status(webhook.status || 502).json({
          error: (webhook.data && webhook.data.error) || webhook.error || 'Pause webhook failed'
        });
      }
      const result = webhook.data || {};
      const pausedAt = result.pausedAt || new Date().toISOString();
      const remainingMs = Number(result.remainingMs || 0);
      await col.updateOne(
        { _id: oid, pending: true },
        {
          $set: {
            autoPaused: true,
            autoPausedAt: pausedAt,
            autoPauseRemainingMs: remainingMs
          }
        }
      );
      const updated = await col.findOne({ _id: oid });
      return res.status(200).json({ success: true, film: updated, result });
    }

    if (req.method === 'POST' && action === 'resumeSubmission' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (film.pending !== true) {
        return res.status(400).json({ error: 'Only pending submissions can be resumed' });
      }
      const submissionId = String(film.submissionId || '').trim();
      if (!submissionId) {
        return res.status(400).json({ error: 'Missing submissionId on pending record' });
      }

      const webhook = await callAppsScriptResumeWebhook(submissionId);
      if (!webhook.ok || (webhook.data && webhook.data.success === false)) {
        return res.status(webhook.status || 502).json({
          error: (webhook.data && webhook.data.error) || webhook.error || 'Resume webhook failed'
        });
      }
      const result = webhook.data || {};
      await col.updateOne(
        { _id: oid, pending: true },
        {
          $set: {
            autoPaused: false,
            autoResumedAt: new Date().toISOString(),
            scheduledDecisionAt: result.scheduledDecisionAt || ''
          },
          $unset: {
            autoPausedAt: '',
            autoPauseRemainingMs: ''
          }
        }
      );
      const updated = await col.findOne({ _id: oid });
      return res.status(200).json({ success: true, film: updated, result });
    }

    if (req.method === 'POST' && action === 'reorder') {
      const payload = req.body && typeof req.body === 'object' ? req.body : {};
      const ids = Array.isArray(payload.ids) ? payload.ids.map(v => String(v)) : [];
      if (!ids.length) {
        return res.status(400).json({ error: 'Missing ids' });
      }
      if (ids.some(v => !ObjectId.isValid(v))) {
        return res.status(400).json({ error: 'Invalid ids' });
      }

      const objectIds = ids.map(v => new ObjectId(v));
      const existing = await col.find({ _id: { $in: objectIds } }).project({ _id: 1, pending: 1 }).toArray();
      const existingSet = new Set(existing.map(doc => String(doc._id)));
      if (ids.some(v => !existingSet.has(v))) {
        return res.status(400).json({ error: 'Unknown film id in reorder list' });
      }
      if (existing.some(doc => doc.pending === true)) {
        return res.status(400).json({ error: 'Pending submissions cannot be reordered here' });
      }

      await col.bulkWrite(
        ids.map((filmId, index) => ({
          updateOne: {
            filter: { _id: new ObjectId(filmId) },
            update: { $set: { sortOrder: index } }
          }
        }))
      );
      return res.status(200).json({ success: true, count: ids.length });
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
      const skipEmail = req.body?.skipEmail === true;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (!film.pending) {
        return res.status(400).json({ error: 'Approve action is only for pending submissions' });
      }
      const emailOverride = String(req.body?.email || '').trim();
      if (!film.email && emailOverride) {
        film.email = emailOverride;
      }
      if (!skipEmail && !film.email) {
        return res.status(400).json({ error: 'Missing email on pending record' });
      }

      if (!skipEmail) {
        const webhook = await callAppsScriptApproveWebhook(film, review);
        if (!webhook.ok) {
          return res.status(webhook.status || 502).json({ error: webhook.error || 'Approve webhook failed' });
        }
        if (webhook.data && webhook.data.success === false) {
          return res.status(400).json({ error: webhook.data.error || 'Approve webhook failed' });
        }
      }

      // New approvals should become the top hero film by default.
      // sortOrder is ascending, so place the film before the current minimum.
      const currentTop = await col
        .find({ live: true, pending: { $ne: true }, sortOrder: { $type: 'number' } })
        .project({ sortOrder: 1 })
        .sort({ sortOrder: 1 })
        .limit(1)
        .toArray();
      const nextTopSortOrder =
        currentTop.length && Number.isFinite(currentTop[0].sortOrder)
          ? currentTop[0].sortOrder - 1
          : 0;

      const approveFields = {
        review,
        pending: false,
        live: true,
        accepted: true,
        sortOrder: nextTopSortOrder,
        rejectionArcActive: false
      };
      if (film.email) approveFields.email = film.email;

      const updateRes = await col.updateOne(
        { _id: oid, pending: true },
        {
          $set: approveFields,
          $unset: {
            rejectionArcId: '',
            rejectionArcStartedAt: '',
            rejectionArcCanceledAt: ''
          }
        }
      );
      if (updateRes.matchedCount === 0) {
        return res.status(409).json({ error: 'Submission was already changed' });
      }
      return res.status(200).json({ success: true });
    }

    // ── RESEND acceptance email for an accepted/live film ───────
    if (req.method === 'POST' && action === 'sendAcceptanceEmail' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (!film.email) {
        return res.status(400).json({ error: 'Missing email on film record' });
      }
      const review = typeof film.review === 'string' && film.review.trim()
        ? film.review
        : generateReview(film);

      const webhook = await callAppsScriptApproveWebhook(film, review);
      if (!webhook.ok) {
        return res.status(webhook.status || 502).json({ error: webhook.error || 'Acceptance email webhook failed' });
      }
      if (webhook.data && webhook.data.success === false) {
        return res.status(400).json({ error: webhook.data.error || 'Acceptance email webhook failed' });
      }

      if (!film.review && review) {
        await col.updateOne({ _id: oid }, { $set: { review } });
      }
      return res.status(200).json({ success: true });
    }

    // ── PREVIEW Instagram post copy/image ──────────────────────
    if (req.method === 'GET' && action === 'instagramPreview' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (film.pending === true) {
        return res.status(400).json({ error: 'Only accepted films can be posted to Instagram' });
      }
      const imageUrl = getInstagramImageUrl(film);
      if (!imageUrl) {
        return res.status(400).json({ error: 'Film needs a real public HTTPS thumbnail before posting' });
      }
      return res.status(200).json({
        caption: buildInstagramCaption(film),
        imageUrl,
        willGenerateLaurelImage: true,
        siteUrl: getPublicSiteUrl(),
        alreadyPostedAt: film.instagramPostedAt || '',
        instagramPostId: film.instagramPostId || ''
      });
    }

    // ── PUBLISH a film post to Instagram ───────────────────────
    if (req.method === 'POST' && action === 'postInstagram' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (film.pending === true) {
        return res.status(400).json({ error: 'Only accepted films can be posted to Instagram' });
      }
      const imageUrl = getInstagramImageUrl(film);
      if (!imageUrl) {
        return res.status(400).json({ error: 'Film needs a real public HTTPS thumbnail before posting' });
      }
      const captionOverride = typeof req.body?.caption === 'string' ? req.body.caption : '';
      const caption = buildInstagramCaption(film, captionOverride);
      if (!caption) {
        return res.status(400).json({ error: 'Missing Instagram caption' });
      }

      const instagramImageUrl = await createAndUploadLaurelPostImage(film, imageUrl);
      const posted = await publishInstagramImage({ imageUrl: instagramImageUrl, caption });
      const postedAt = new Date().toISOString();
      await col.updateOne(
        { _id: oid },
        {
          $set: {
            instagramPostedAt: postedAt,
            instagramPostId: posted.postId,
            instagramPostCaption: caption,
            instagramPostImageUrl: instagramImageUrl,
            instagramSourceImageUrl: imageUrl
          },
          $unset: { instagramPostError: '' }
        }
      );

      return res.status(200).json({
        success: true,
        instagramPostId: posted.postId,
        instagramCreationId: posted.creationId,
        instagramPostedAt: postedAt,
        caption,
        imageUrl: instagramImageUrl,
        sourceImageUrl: imageUrl
      });
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

    // ── REJECT a pending submission (send email + cleanup) ──────
    if (req.method === 'DELETE' && action === 'reject' && id) {
      const oid = toObjectId(id, res);
      if (!oid) return;
      const film = await col.findOne({ _id: oid });
      if (!film) return res.status(404).json({ error: 'Not found' });
      if (!film.pending) {
        return res.status(400).json({ error: 'Reject action is only for pending submissions' });
      }
      if (film.rejectionArcActive === true) {
        return res.status(409).json({ error: 'Rejection arc already in progress for this submission' });
      }
      if (!film.submissionId) {
        return res.status(400).json({ error: 'Missing submissionId on pending record' });
      }

      const webhook = await callAppsScriptRejectWebhook(String(film.submissionId));
      if (!webhook.ok) {
        return res.status(webhook.status || 502).json({ error: webhook.error || 'Reject webhook failed' });
      }
      if (webhook.data && webhook.data.success === false) {
        return res.status(400).json({ error: webhook.data.error || 'Reject webhook failed' });
      }

      const shouldRetainPending =
        webhook.data &&
        webhook.data.rejectionMode === 'arc' &&
        webhook.data.rejectionArcStarted === true &&
        webhook.data.rejectionArcPendingRetained === true;

      let arcIdForPending = shouldRetainPending ? String(webhook.data.rejectionArcId || '') : '';
      let retainPending = !!shouldRetainPending;

      // Backward-compatible fallback: if manualReject response does not include
      // arc metadata, check tracker for an active arc on this submissionId.
      if (!retainPending) {
        const trackerWebhook = await callAppsScriptWebhook({ action: 'arcTracker' });
        if (trackerWebhook.ok && Array.isArray(trackerWebhook.data?.arcs)) {
          const activeArc = trackerWebhook.data.arcs.find(a => String(a?.submissionId || '') === String(film.submissionId));
          if (activeArc) {
            retainPending = true;
            arcIdForPending = String(activeArc.arcId || '');
          }
        }
      }

      if (retainPending) {
        await col.updateOne(
          { _id: oid, pending: true },
          {
            $set: {
              rejectionArcActive: true,
              rejectionArcId: arcIdForPending,
              rejectionArcStartedAt: new Date().toISOString()
            }
          }
        );
      }

      return res.status(200).json({
        success: true,
        rejectionArcActive: retainPending,
        rejectionArcId: retainPending ? arcIdForPending : ''
      });
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
    console.error('admin api error', {
      method: req.method,
      action: req.query?.action,
      id: req.query?.id || null,
      message: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : null
    });
    return res.status(500).json({ error: 'Server error' });
  }
}
