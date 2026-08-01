import { ensureDatabase, migrate } from './initDb';

async function main() {
  await ensureDatabase();
  await migrate();
}

main().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
