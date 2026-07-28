"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryAuditQueue = void 0;
class InMemoryAuditQueue {
    buffer = [];
    timer = null;
    flushFn;
    bufferSize;
    flushIntervalMs;
    constructor(params) {
        this.flushFn = params.flushFn;
        this.bufferSize = params.bufferSize ?? 1000;
        this.flushIntervalMs = params.flushIntervalMs ?? 3000;
        this.timer = setInterval(() => {
            void this.flush().catch((err) => {
                console.error('[audit-queue] flush error', err);
            });
        }, this.flushIntervalMs);
    }
    async add(payload) {
        this.buffer.push(payload);
        if (this.buffer.length >= this.bufferSize) {
            await this.flush();
        }
    }
    async close() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        await this.flush();
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        const toFlush = this.buffer.splice(0, this.buffer.length);
        try {
            await this.flushFn(toFlush);
        }
        catch (err) {
            console.error('[audit-queue] flush failed, re-queuing', err);
            this.buffer.unshift(...toFlush);
        }
    }
}
exports.InMemoryAuditQueue = InMemoryAuditQueue;
//# sourceMappingURL=queue.js.map