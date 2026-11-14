'use strict';

/**
 * Passenger verification enters the same review lifecycle as drivers:
 * unverified -> pending -> approved/rejected.
 *
 * Existing passengers that already supplied national ID + home address are
 * moved to `pending` so they appear in the admin review flow instead of
 * staying permanently unverified.
 */

var info = {
    revision: 38,
    name: 'passenger-verification-backfill',
    created: '2026-11-14T00:00:00.000Z',
    comment: 'mark complete passenger profiles as pending verification',
};

var migrationCommands = [
    {
        fn: 'rawQuery',
        params: [
            `UPDATE "users" u
             SET "verification_status" = 'pending',
                 "verification_submitted_at" = COALESCE(u."verification_submitted_at", now()),
                 "verification_rejected_at" = NULL,
                 "verification_rejection_reason" = NULL,
                 "verification_rejection_fields" = '[]'::jsonb,
                 "updatedat" = now()
             FROM "passenger_profiles" pp
             WHERE pp."passenger_id" = u."id"
               AND u."role" = 'passenger'
               AND u."is_verified" = false
               AND u."verification_status" = 'unverified'
               AND pp."national_id" IS NOT NULL
               AND pp."home_address" IS NOT NULL`,
        ],
    },
];

module.exports = {
    pos: 0,
    migrationCommands,
    up: function (queryInterface) {
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < migrationCommands.length) {
                    const command = migrationCommands[index];
                    console.log('[# ' + index + '] execute: ' + command.fn);
                    index += 1;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                } else {
                    resolve();
                }
            }
            next();
        });
    },
    down: function () {
        return Promise.resolve();
    },
    info: info,
};
