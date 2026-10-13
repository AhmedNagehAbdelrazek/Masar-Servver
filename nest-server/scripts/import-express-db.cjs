#!/usr/bin/env node
// One-shot data import: Express/Sequelize database -> Prisma-managed Nest
// database. Copies every table parents-first with explicit column mapping.
//
// Usage (from nest-server/):
//   node scripts/import-express-db.cjs --src=app_db --yes
//
// --src   source database name (default: app_db)
// --yes   required: truncates all target tables first (except
//         _prisma_migrations). Without it the script refuses to run.
//
// Notes:
// - Values are validated against the TARGET Postgres enum labels; unknown
//   labels abort loudly instead of half-copying.
// - `driver_profiles.national_i_d` (Sequelize name mangling) maps to
//   Prisma's `national_id`.
// - IDs are preserved, so all FK references stay intact.
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? true] : [];
  }),
);

// Minimal .env parser (dotenv is a dependency but this script must also run
// standalone): KEY = value, ignores comments, strips wrapping quotes.
function loadEnv(file) {
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[m[1]] = v;
    }
  }
  return env;
}

// Parents first so FK references resolve on insert.
const TABLE_ORDER = [
  'users',
  'subscription_plans',
  'payment_methods',
  'uploaded_images',
  'driver_profiles',
  'passenger_profiles',
  'vehicles',
  'driver_subscriptions',
  'subscription_transactions',
  'trips',
  'trip_attributes',
  'trip_stops',
  'trip_seats',
  'bookings',
  'ratings',
  'delay_events',
  'complaints',
  'penalties',
  'trip_locations',
  'ride_requests',
  'request_offers',
  'favorite_drivers',
  'favorite_routes',
  'recent_search',
  'notification_settings',
  'notifications',
  'support_tickets',
  'support_ticket_messages',
  'messages',
  'sos_events',
  'verification_status_changes',
  'document_reviews',
  'deletion_requests',
  'audit_logs',
];

const COLUMN_MAP = {
  driver_profiles: { national_i_d: 'national_id' },
};

async function columns(client, table) {
  const r = await client.query(
    `SELECT column_name, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table],
  );
  return r.rows;
}

async function enumLabels(client) {
  const r = await client.query(
    `SELECT t.typname AS typ, e.enumlabel AS lbl FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public'`,
  );
  const map = new Map();
  for (const row of r.rows) {
    if (!map.has(row.typ)) map.set(row.typ, new Set());
    map.get(row.typ).add(row.lbl);
  }
  return map;
}

const PRIMITIVE_UDTS = new Set([
  'uuid', 'varchar', 'text', 'bool', 'int2', 'int4', 'int8', 'float4', 'float8',
  'numeric', 'timestamptz', 'timestamp', 'date', 'json', 'jsonb', 'bytea', '_varchar', '_text', '_uuid', '_int4',
]);

async function main() {
  if (args.yes !== true && args.yes !== 'true') {
    console.error('Refusing to run without --yes (target tables are truncated first).');
    process.exit(2);
  }
  const env = loadEnv(path.join(__dirname, '..', '.env'));
  const base = {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL_MODE === '1' || env.DB_SSL_MODE === 'require' ? { rejectUnauthorized: false } : undefined,
  };
  const srcDb = args.src || 'app_db';
  const dstDb = env.DB_NAME;
  if (!dstDb) throw new Error('DB_NAME missing in .env');
  console.log(`Copy ${srcDb} -> ${dstDb}`);

  const src = new Client({ ...base, database: String(srcDb) });
  const dst = new Client({ ...base, database: String(dstDb) });
  await src.connect();
  await dst.connect();

  const dstEnums = await enumLabels(dst);

  const existing = await dst.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename = ANY($1)`,
    [TABLE_ORDER],
  );
  const existingSet = new Set(existing.rows.map((r) => r.tablename));

  console.log('Truncating target tables...');
  await dst.query(
    `TRUNCATE TABLE ${TABLE_ORDER.filter((t) => existingSet.has(t)).map((t) => `"${t}"`).join(', ')} CASCADE`,
  );

  let total = 0;
  for (const table of TABLE_ORDER) {
    if (!existingSet.has(table)) {
      console.log(`${table}: target table missing, skipped`);
      continue;
    }
    const srcCols = await columns(src, table);
    if (srcCols.length === 0) continue;
    const dstCols = await columns(dst, table);
    const dstByName = new Map(dstCols.map((c) => [c.column_name, c.udt_name]));
    const rename = COLUMN_MAP[table] || {};

    const pairs = [];
    for (const c of srcCols) {
      const target = rename[c.column_name] || c.column_name;
      if (dstByName.has(target)) pairs.push({ src: c.column_name, dst: target, udt: dstByName.get(target) });
    }
    if (pairs.length === 0) {
      console.log(`${table}: no common columns, skipped`);
      continue;
    }
    const rows = (await src.query(`SELECT * FROM "${table}"`)).rows;
    if (rows.length === 0) continue;

    // Validate enum values before touching the target.
    for (const p of pairs) {
      if (PRIMITIVE_UDTS.has(p.udt)) continue;
      const labels = dstEnums.get(p.udt);
      if (!labels) throw new Error(`${table}.${p.dst}: target enum type "${p.udt}" not found`);
      for (const row of rows) {
        const v = row[p.src];
        if (v !== null && v !== undefined && !labels.has(String(v))) {
          throw new Error(`${table}.${p.src}: value ${JSON.stringify(v)} not in target enum "${p.udt}"`);
        }
      }
    }

    const colList = pairs.map((p) => `"${p.dst}"`).join(', ');
    let copied = 0;
    const BATCH = 200;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const values = [];
      const placeholders = batch.map((row, bi) => {
        const rowPh = pairs.map((p, pi) => {
          let v = row[p.src];
          // node-pg does not stringify plain objects for json/jsonb.
          if ((p.udt === 'json' || p.udt === 'jsonb') && v !== null && v !== undefined && typeof v !== 'string') {
            v = JSON.stringify(v);
          }
          values.push(v);
          const n = values.length;
          return PRIMITIVE_UDTS.has(p.udt) ? `$${n}` : `CAST($${n} AS "${p.udt}")`;
        });
        void bi;
        return `(${rowPh.join(', ')})`;
      });
      await dst.query(`INSERT INTO "${table}" (${colList}) VALUES ${placeholders.join(', ')}`, values);
      copied += batch.length;
    }
    const check = await dst.query(`SELECT count(*) AS c FROM "${table}"`);
    if (Number(check.rows[0].c) !== rows.length) {
      throw new Error(`${table}: count mismatch (src=${rows.length}, dst=${check.rows[0].c})`);
    }
    console.log(`${table}: ${copied} rows`);
    total += copied;
  }

  await src.end();
  await dst.end();
  console.log(`Done. ${total} rows copied.`);
}

main().catch((e) => {
  console.error('IMPORT_FAILED: ' + (e && e.message ? e.message : String(e)).split('\n')[0]);
  process.exit(1);
});
