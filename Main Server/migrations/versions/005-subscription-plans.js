'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "subscription_plans", deps: []
 * createTable "payment_methods", deps: []
 * createTable "driver_subscriptions", deps: [users, subscription_plans]
 * addColumn "total_balance" on table "users"
 * addColumn "is_in_debt" on table "users"
 * addColumn "is_blocked_by_balance" on table "trips"
 * addIndex "idx_subscriptions_unique_pending" (partial unique) on "driver_subscriptions"
 * addConstraint CHECK status on "driver_subscriptions"
 * addConstraint CHECK balance >= 0 on "driver_subscriptions"
 * addConstraint CHECK type on "payment_methods"
 *
 **/

var info = {
    "revision": 5,
    "name": "subscription-plans",
    "created": "2026-07-31T00:00:00.000Z",
    "comment": ""
};

function migrationSteps(queryInterface) {
  return [
    // subscription_plans
    function () {
      return queryInterface.createTable('subscription_plans', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        name: { type: Sequelize.STRING(100), allowNull: false },
        periodDays: { type: Sequelize.INTEGER, field: 'period_days', allowNull: false },
        percentageCut: { type: Sequelize.DECIMAL(5, 2), field: 'percentage_cut', allowNull: false, defaultValue: 0 },
        cost: { type: Sequelize.DECIMAL(10, 2), field: 'cost', allowNull: false, defaultValue: 0 },
        status: { type: Sequelize.STRING(30), field: 'status', allowNull: true },
        features: { type: Sequelize.JSONB, field: 'features', allowNull: false, defaultValue: Sequelize.literal("'[]'::jsonb") },
        isFree: { type: Sequelize.BOOLEAN, field: 'is_free', allowNull: false, defaultValue: false },
        freeOffer: { type: Sequelize.JSONB, field: 'free_offer', allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, field: 'is_active', allowNull: false, defaultValue: true },
        createdat: { type: Sequelize.DATE, field: 'createdat', allowNull: false },
        updatedat: { type: Sequelize.DATE, field: 'updatedat', allowNull: false },
      });
    },
    // payment_methods
    function () {
      return queryInterface.createTable('payment_methods', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        name: { type: Sequelize.STRING(100), allowNull: false },
        accountNumber: { type: Sequelize.STRING(50), field: 'account_number', allowNull: false },
        type: { type: Sequelize.STRING(30), field: 'type', allowNull: false },
        email: { type: Sequelize.STRING(100), field: 'email', allowNull: true },
        isActive: { type: Sequelize.BOOLEAN, field: 'is_active', allowNull: false, defaultValue: true },
        createdat: { type: Sequelize.DATE, field: 'createdat', allowNull: false },
        updatedat: { type: Sequelize.DATE, field: 'updatedat', allowNull: false },
      });
    },
    // driver_subscriptions
    function () {
      return queryInterface.createTable('driver_subscriptions', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
        driverId: { type: Sequelize.UUID, field: 'driver_id', allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        planId: { type: Sequelize.UUID, field: 'plan_id', allowNull: false, references: { model: 'subscription_plans', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
        planName: { type: Sequelize.STRING(100), field: 'plan_name', allowNull: false },
        planPeriodDays: { type: Sequelize.INTEGER, field: 'plan_period_days', allowNull: false },
        planPercentageCut: { type: Sequelize.DECIMAL(5, 2), field: 'plan_percentage_cut', allowNull: false },
        planCost: { type: Sequelize.DECIMAL(10, 2), field: 'plan_cost', allowNull: false },
        balance: { type: Sequelize.DECIMAL(10, 2), field: 'balance', allowNull: false, defaultValue: 0 },
        screenshotUrl: { type: Sequelize.TEXT, field: 'screenshot_url', allowNull: true },
        paymentMethod: { type: Sequelize.JSONB, field: 'payment_method', allowNull: false, defaultValue: Sequelize.literal("'{}'::jsonb") },
        adminNotes: { type: Sequelize.TEXT, field: 'admin_notes', allowNull: true },
        status: { type: Sequelize.STRING(20), field: 'status', allowNull: false, defaultValue: 'pending_approval' },
        approvedAt: { type: Sequelize.DATE, field: 'approved_at', allowNull: true },
        activatedAt: { type: Sequelize.DATE, field: 'activated_at', allowNull: true },
        expiresAt: { type: Sequelize.DATE, field: 'expires_at', allowNull: true },
        createdat: { type: Sequelize.DATE, field: 'createdat', allowNull: false },
        updatedat: { type: Sequelize.DATE, field: 'updatedat', allowNull: false },
      });
    },
    // users ALTERs
    function () {
      return queryInterface.addColumn('users', 'total_balance', { type: Sequelize.DECIMAL(10, 2), field: 'total_balance', allowNull: false, defaultValue: 0 });
    },
    function () {
      return queryInterface.addColumn('users', 'is_in_debt', { type: Sequelize.BOOLEAN, field: 'is_in_debt', allowNull: false, defaultValue: false });
    },
    // trips ALTER
    function () {
      return queryInterface.addColumn('trips', 'is_blocked_by_balance', { type: Sequelize.BOOLEAN, field: 'is_blocked_by_balance', allowNull: false, defaultValue: false });
    },
    // partial unique index (no duplicate pending per driver+plan)
    function () {
      return queryInterface.sequelize.query(
        'CREATE UNIQUE INDEX IF NOT EXISTS "idx_subscriptions_unique_pending" ON "driver_subscriptions" ("driver_id", "plan_id") WHERE "status" = \'pending_approval\''
      );
    },
    // CHECK constraints
    function () {
      return queryInterface.addConstraint('driver_subscriptions', {
        fields: ['status'],
        type: 'check',
        name: 'ck_subscriptions_status',
        where: Sequelize.literal("\"status\" IN ('pending_approval','active','rejected','cancelled','expired')"),
      }).catch(function () { /* already exists (42701 ignored downstream) */ });
    },
    function () {
      return queryInterface.addConstraint('driver_subscriptions', {
        fields: ['balance'],
        type: 'check',
        name: 'ck_subscriptions_balance',
        where: Sequelize.literal('"balance" >= 0'),
      }).catch(function () { /* already exists */ });
    },
    function () {
      return queryInterface.addConstraint('payment_methods', {
        fields: ['type'],
        type: 'check',
        name: 'ck_payment_methods_type',
        where: Sequelize.literal("\"type\" IN ('bank_account','e-wallet','mobile_money')"),
      }).catch(function () { /* already exists */ });
    },
    // indexes
    function () {
      return queryInterface.addIndex('subscription_plans', ['is_active'], { name: 'idx_plans_active' });
    },
    function () {
      return queryInterface.addIndex('driver_subscriptions', ['driver_id', 'status'], { name: 'idx_subscriptions_driver' });
    },
    function () {
      return queryInterface.addIndex('driver_subscriptions', ['plan_id'], { name: 'idx_subscriptions_plan' });
    },
    function () {
      return queryInterface.addIndex('driver_subscriptions', ['status', 'expires_at'], { name: 'idx_subscriptions_expiry' });
    },
    function () {
      return queryInterface.addIndex('payment_methods', ['is_active'], { name: 'idx_payment_methods_active' });
    },
  ];
}

module.exports = {
    pos: 0,
    up: function (queryInterface, Sequelize) {
        var steps = migrationSteps(queryInterface);
        var index = this.pos;
        return new Promise(function (resolve, reject) {
            function next() {
                if (index < steps.length) {
                    console.log('[#' + index + '] execute migration step');
                    index++;
                    Promise.resolve(steps[index - 1]()).then(next, reject);
                } else {
                    resolve();
                }
            }
            next();
        });
    },
    info: info
};
