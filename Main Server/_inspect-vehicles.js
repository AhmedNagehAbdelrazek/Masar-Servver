const { Sequelize } = require('sequelize');
const cfg = require('./config/config');
const s = new Sequelize(cfg.development);
(async () => {
  const [r] = await s.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='vehicles' ORDER BY ordinal_position");
  console.log(r.map(c => `${c.column_name}:${c.data_type}:${c.is_nullable}`).join('\n'));
  await s.close();
})().catch(e => { console.error(e.message); process.exit(1); });
