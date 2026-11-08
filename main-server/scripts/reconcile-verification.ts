// One-off reconciliation for drivers whose per-document reviews and
// driver-level verification fields drifted apart. Run AFTER deploying the
// admin-dashboard auto-verification fix:
//
//   pnpm --dir main-server exec tsx scripts/reconcile-verification.ts
//
// It only changes a driver when the document evidence is unambiguous:
//   * any rejected required document -> verification_status=rejected
//   * every required document uploaded and approved -> approved + verified
// Everything else is reported and left untouched. Notifications are not sent
// (the admin can use the dossier "اعتماد السائق" action if a message is due).
import sequelize from '../config/database';
import {
  User,
  DriverProfile,
  Vehicle,
  DocumentReview,
  VerificationStatusChange,
} from '../Models';

const REQUIRED = [
  ['profile', 'userIdentificationFront'],
  ['profile', 'userIdentificationBack'],
  ['profile', 'personalImageWithId'],
  ['profile', 'linceseFront'],
  ['profile', 'linceseBack'],
  ['vehicle', 'registrationDocFront'],
  ['vehicle', 'registrationDocBack'],
] as const;

async function main(): Promise<void> {
  await sequelize.authenticate();
  const drivers = await User.findAll({ where: { role: 'driver' } });
  let approved = 0;
  let rejected = 0;
  let skipped = 0;

  for (const driver of drivers) {
    const [profile, vehicle, reviews] = await Promise.all([
      DriverProfile.findOne({ where: { driverId: driver.id } }),
      Vehicle.findOne({ where: { driverId: driver.id } }),
      DocumentReview.findAll({ where: { driverId: driver.id } }),
    ]);
    if (!profile) {
      skipped += 1;
      continue;
    }
    const reviewByField = new Map<string, string>();
    for (const review of reviews) reviewByField.set(review.documentKey, review.decision);

    const fieldForKey: Record<string, string> = {
      userIdentificationFront: 'id_front',
      userIdentificationBack: 'id_back',
      personalImageWithId: 'face_photo',
      linceseFront: 'license_front',
      linceseBack: 'license_back',
      registrationDocFront: 'registration_front',
      registrationDocBack: 'registration_back',
    };

    const missing: string[] = [];
    const rejectedDocs: string[] = [];
    for (const [source, field] of REQUIRED) {
      const record = source === 'profile' ? profile : vehicle;
      const imageId = (record as unknown as Record<string, number | null>)[field];
      if (imageId == null) missing.push(field);
      const decision = reviewByField.get(fieldForKey[field]);
      if (decision === 'rejected') rejectedDocs.push(fieldForKey[field]);
    }

    if (rejectedDocs.length > 0) {
      if (driver.verificationStatus !== 'rejected') {
        const fromStatus = driver.verificationStatus;
        await driver.update({
          isVerified: false,
          verificationStatus: 'rejected',
          verificationRejectedAt: new Date(),
          verificationRejectionReason: 'One or more documents were rejected',
          verificationRejectionFields: rejectedDocs,
        });
        await VerificationStatusChange.create({
          driverId: driver.id,
          fromStatus,
          toStatus: 'rejected',
          reason: 'Reconciled from document reviews',
          markedFields: rejectedDocs,
        });
        rejected += 1;
        console.log(`rejected: ${driver.id} ${driver.fullName || ''} (${rejectedDocs.join(', ')})`);
      } else {
        skipped += 1;
      }
      continue;
    }

    const allApproved = missing.length === 0
      && REQUIRED.every(([, field]) => reviewByField.get(fieldForKey[field]) === 'approved');

    if (!allApproved) {
      skipped += 1;
      continue;
    }

    if (driver.verificationStatus === 'approved' && driver.isVerified) {
      skipped += 1;
      continue;
    }

    const fromStatus = driver.verificationStatus;
    await profile.update({ idVerified: true });
    if (vehicle) {
      await vehicle.update({
        isVerified: true,
        verificationRejectedAt: null,
        verificationRejectionReason: null,
      });
    }
    await driver.update({
      isVerified: true,
      verificationStatus: 'approved',
      verificationRejectedAt: null,
      verificationRejectionReason: null,
      verificationRejectionFields: [],
    });
    await VerificationStatusChange.create({
      driverId: driver.id,
      fromStatus,
      toStatus: 'approved',
      reason: 'Reconciled from document reviews',
    });
    approved += 1;
    console.log(`approved: ${driver.id} ${driver.fullName || ''}`);
  }

  console.log(`\nDone. approved=${approved} rejected=${rejected} skipped=${skipped}`);
  await sequelize.close();
}

main().catch(async (err: unknown) => {
  console.error(err);
  try {
    await sequelize.close();
  } catch {
    // ignore
  }
  process.exitCode = 1;
});
