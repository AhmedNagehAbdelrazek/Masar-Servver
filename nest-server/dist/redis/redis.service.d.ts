import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService);
    get connection(): Redis;
    setKey(key: string, value: string, ttlSeconds?: number): Promise<void>;
    getKey(key: string): Promise<string | null>;
    deleteKey(...keys: string[]): Promise<number>;
    exists(key: string): Promise<boolean>;
    incr(key: string): Promise<number>;
    onModuleDestroy(): Promise<void>;
}
