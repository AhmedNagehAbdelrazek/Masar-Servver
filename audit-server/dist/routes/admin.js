"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminRouter = createAdminRouter;
const express_1 = __importDefault(require("express"));
const node_crypto_1 = __importDefault(require("node:crypto"));
function createAdminRouter(pool) {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.post('/admin/services', async (req, res) => {
        try {
            const { name, environment, description } = req.body;
            if (!name || !environment) {
                res.status(400).json({ error: { code: 'VALIDATION', message: 'name and environment are required' } });
                return;
            }
            const serviceResult = await pool.query(`INSERT INTO audit.services (name, environment, description)
         VALUES ($1, $2, $3)
         RETURNING id, name, environment, description, status, created_at`, [name, environment, description || null]);
            const service = serviceResult.rows[0];
            const clientKey = `${name}.${environment}`;
            const clientSecret = node_crypto_1.default.randomBytes(48).toString('base64url');
            await pool.query(`INSERT INTO audit.service_credentials (service_id, client_key, secret_encrypted)
         VALUES ($1, $2, $3)`, [service.id, clientKey, clientSecret]);
            res.status(201).json({
                service_id: service.id,
                client_key: clientKey,
                client_secret: clientSecret,
                name: service.name,
                environment: service.environment,
            });
        }
        catch (err) {
            if (err.code === '23505') {
                res.status(409).json({ error: { code: 'CONFLICT', message: 'Service already exists' } });
                return;
            }
            console.error('[audit-server] admin service creation error', err.message);
            res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create service' } });
        }
    });
    router.get('/admin/services', async (_req, res) => {
        try {
            const result = await pool.query(`SELECT id, name, environment, description, status, created_at
         FROM audit.services ORDER BY created_at DESC`);
            res.json({ services: result.rows });
        }
        catch (err) {
            console.error('[audit-server] admin list services error', err.message);
            res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to list services' } });
        }
    });
    router.post('/admin/services/:serviceId/credentials', async (req, res) => {
        try {
            const { serviceId } = req.params;
            const serviceResult = await pool.query(`SELECT id FROM audit.services WHERE id = $1 AND status = 'active'`, [serviceId]);
            if (serviceResult.rows.length === 0) {
                res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Service not found' } });
                return;
            }
            const clientKey = `key-${node_crypto_1.default.randomBytes(16).toString('hex')}`;
            const clientSecret = node_crypto_1.default.randomBytes(48).toString('base64url');
            await pool.query(`INSERT INTO audit.service_credentials (service_id, client_key, secret_encrypted)
         VALUES ($1, $2, $3)`, [serviceId, clientKey, clientSecret]);
            res.status(201).json({ client_key: clientKey, client_secret: clientSecret });
        }
        catch (err) {
            console.error('[audit-server] admin credential creation error', err.message);
            res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create credentials' } });
        }
    });
    return router;
}
//# sourceMappingURL=admin.js.map