#!/usr/bin/env node
/**
 * init-db.mjs — إنشاء قاعدة البيانات المحلية
 *
 * يتصل بـ MongoDB المحلي وينشئ قاعدة البيانات web-social-e1 والمجموعات.
 * شغّل: node scripts/init-db.mjs
 * أو: npm run db:init
 */

import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// تحميل .env.local إن وُجد
for (const f of ['.env.local', '.env']) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()])
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    break;
  }
}

const DB_URI = (
  process.env.DATABASE_URL ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/web-social-e1'
).replace(/localhost(?=[:\/]|$)/g, '127.0.0.1');

async function initDb() {
  console.log('Connecting to MongoDB...');
  const conn = await mongoose.connect(DB_URI);
  const db = conn.connection.db;
  const dbName = db.databaseName;

  const collections = ['users', 'photos', 'likes'];
  for (const name of collections) {
    try {
      await db.createCollection(name);
      console.log(`  ✓ ${name}`);
    } catch (err) {
      if (err.codeName === 'NamespaceExists') {
        console.log(`  ✓ ${name} (exists)`);
      } else {
        console.error(`  ✗ ${name}:`, err.message);
      }
    }
  }

  console.log(`\nDatabase "${dbName}" ready.`);
  await mongoose.disconnect();
}

initDb().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
