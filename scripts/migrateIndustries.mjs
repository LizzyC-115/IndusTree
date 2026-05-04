/**
 * One-time migration script: updates Firestore user documents whose
 * `industry` field contains an old value to the closest new industry.
 *
 * Run from the project root:
 *   node scripts/migrateIndustries.mjs
 *
 * Requires the firebase package (already in node_modules).
 * Reads credentials from .env (same file the dev server uses).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Load .env manually (dotenv not required – we parse it ourselves)
// ---------------------------------------------------------------------------
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');

const env = {};
try {
  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
} catch {
  console.error('Could not read .env – falling back to .env.example values');
}

// ---------------------------------------------------------------------------
// Firebase config (prefers .env, falls back to .env.example literals)
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY            || 'AIzaSyBreb5_B1ap05i3alPcnRwgnB0pYkHI1UY',
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN        || 'industree-35c22.firebaseapp.com',
  projectId:         env.VITE_FIREBASE_PROJECT_ID         || 'industree-35c22',
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET     || 'industree-35c22.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID|| '627548701601',
  appId:             env.VITE_FIREBASE_APP_ID             || '1:627548701601:web:45cc6433f669c4442f81e0',
};

// ---------------------------------------------------------------------------
// Industry mapping: old value → new canonical value
// Values already in the new list are kept as-is automatically.
// ---------------------------------------------------------------------------
const INDUSTRY_MAP = {
  'Technology':  'SWE/Tech',
  'Healthcare':  'Medicine',
  'Education':   'Academia',
  'Marketing':   'PM',
  // These were already valid and need no change:
  // 'Finance', 'Consulting', 'Engineering'
  // 'Other' has no clear closest match – cleared so user can re-select.
  'Other':       '',
};

const NEW_INDUSTRIES = new Set([
  'Finance', 'Consulting', 'PM', 'SWE/Tech', 'Quant', 'Engineering', 'Medicine', 'Academia',
]);

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------
async function migrate() {
  const app = initializeApp(firebaseConfig);
  const db  = getFirestore(app);

  console.log('Fetching all user documents...');
  const snapshot = await getDocs(collection(db, 'users'));
  console.log(`Found ${snapshot.size} user(s).`);

  let updated = 0;
  let skipped = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const current = data.industry ?? '';

    // Already a valid new industry – nothing to do.
    if (NEW_INDUSTRIES.has(current)) {
      skipped++;
      continue;
    }

    const mapped = INDUSTRY_MAP[current] ?? '';
    const ref = doc(db, 'users', userDoc.id);
    await updateDoc(ref, { industry: mapped });

    console.log(
      `  [${userDoc.id}] username="${data.username ?? '?'}"  ` +
      `"${current || '(empty)'}" → "${mapped || '(cleared)'}"`
    );
    updated++;
  }

  console.log(`\nDone. ${updated} document(s) updated, ${skipped} already correct.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
