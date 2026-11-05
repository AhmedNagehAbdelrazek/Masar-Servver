import { sequelize } from '../Models';

interface ColumnRow {
  column_name: string;
}

interface TableRow {
  table_name: string;
}

interface MigrationRow {
  version?: string;
  filename?: string;
  [key: string]: unknown;
}

(async (): Promise<void> => {
  try {
    const [rows] = (await sequelize.query(
      'SELECT * FROM _schema_migrations ORDER BY version DESC LIMIT 8'
    )) as unknown as [MigrationRow[], unknown];
    console.log(JSON.stringify(rows, null, 1));
    const [cols] = (await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('completed_at')"
    )) as unknown as [ColumnRow[], unknown];
    const [cols2] = (await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='request_offers' AND column_name IN ('agreed_fare','booking_id')"
    )) as unknown as [ColumnRow[], unknown];
    const [cols3] = (await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='support_tickets' AND column_name IN ('reference_code','booking_id','trip_id')"
    )) as unknown as [ColumnRow[], unknown];
    const [tbl] = (await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name='support_ticket_messages'"
    )) as unknown as [TableRow[], unknown];
    console.log('bookings.completed_at:', cols.length);
    console.log('request_offers new:', cols2.map((c: ColumnRow) => c.column_name));
    console.log('support_tickets new:', cols3.map((c: ColumnRow) => c.column_name));
    console.log('support_ticket_messages table:', tbl.length);
  } catch (e: unknown) {
    const msg: string = e instanceof Error ? e.message : String(e);
    console.log('ERR:', msg);
  }
  process.exit(0);
})();

export {};
