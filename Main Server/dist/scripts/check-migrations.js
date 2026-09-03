"use strict";
const { sequelize } = require('../Models');
(async () => {
    try {
        const [rows] = await sequelize.query("SELECT * FROM _schema_migrations ORDER BY version DESC LIMIT 8");
        console.log(JSON.stringify(rows, null, 1));
        const [cols] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('completed_at')");
        const [cols2] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='request_offers' AND column_name IN ('agreed_fare','booking_id')");
        const [cols3] = await sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name='support_tickets' AND column_name IN ('reference_code','booking_id','trip_id')");
        const [tbl] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name='support_ticket_messages'");
        console.log('bookings.completed_at:', cols.length);
        console.log('request_offers new:', cols2.map((c) => c.column_name));
        console.log('support_tickets new:', cols3.map((c) => c.column_name));
        console.log('support_ticket_messages table:', tbl.length);
    }
    catch (e) {
        console.log('ERR:', e.message);
    }
    process.exit(0);
})();
//# sourceMappingURL=check-migrations.js.map