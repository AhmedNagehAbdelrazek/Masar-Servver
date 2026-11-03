/**
 * Manual SMS gateway smoke test (run from the `Main Server` directory).
 *
 *   npx tsx scripts/sms-check.ts
 *   npx tsx scripts/sms-check.ts 9627XXXXXXXX "Test from Masar"
 *   npx tsx scripts/sms-check.ts 9627XXXXXXXX "Test from Masar" MasarCar
 *
 * The first form only checks credentials/connectivity via the balance
 * endpoint. Supplying a phone number sends a real SMS (costs credits).
 * The optional last argument overrides SMS_SENDER_ID for the test.
 */
import dotenv from 'dotenv';
import { join } from 'node:path';

dotenv.config({ path: join(__dirname, '..', '.env') });

const senderOverride = process.argv[4];
if (senderOverride) {
  process.env.SMS_SENDER_ID = senderOverride;
  console.log('Sender override:', senderOverride);
}

async function main(): Promise<void> {
  const { checkSmsBalance, sendSms, checkSmsStatus } = await import('../Services/smsService');

  console.log('Provider:', process.env.SMS_PROVIDER_BASE);
  console.log('Sender  :', process.env.SMS_SENDER_ID);

  const balance = await checkSmsBalance();
  console.log('Balance :', balance);

  const phone = process.argv[2];
  if (!phone) {
    console.log('\nNo phone supplied - balance check only.');
    console.log('Send a test: npx tsx scripts/sms-check.ts 9627XXXXXXXX "Test from Masar"');
    return;
  }

  const text = process.argv[3] || 'Masar Car test message';
  const result = await sendSms(phone, text);
  console.log('Send    :', result);

  if (result.success && result.messageId) {
    const status = await checkSmsStatus(result.messageId);
    console.log('Status  :', status);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
