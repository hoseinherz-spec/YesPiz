import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memoryLocks = new Map<
    string,
    { owner: string; expiresAt: number }
  >();
  private readonly useMemory: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>("REDIS_URL");
    if (url) {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      this.client.on("error", (err: Error) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });
      this.useMemory = false;
    } else {
      this.logger.log("REDIS_URL unset — using in-memory lock fallback");
      this.useMemory = true;
    }
  }

  async ready() {
    if (this.client) return (await this.client.ping()) === "PONG";
    return this.config.get("NODE_ENV") !== "production";
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  async acquireLock(
    key: string,
    owner: string,
    ttlMs = 15_000,
  ): Promise<boolean> {
    if (this.client) {
      try {
        const result = await this.client.set(key, owner, "PX", ttlMs, "NX");
        return result === "OK";
      } catch (err) {
        if (this.config.get<string>("NODE_ENV") === "production") throw err;
        this.logger.warn(
          `Redis SET failed, falling back to memory: ${(err as Error).message}`,
        );
      }
    }
    return this.acquireMemoryLock(key, owner, ttlMs);
  }

  async releaseLock(key: string, owner: string): Promise<void> {
    if (this.client) {
      try {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end`;
        await this.client.eval(script, 1, key, owner);
        return;
      } catch {
        // fall through
      }
    }
    const current = this.memoryLocks.get(key);
    if (current?.owner === owner) {
      this.memoryLocks.delete(key);
    }
  }

  private acquireMemoryLock(
    key: string,
    owner: string,
    ttlMs: number,
  ): boolean {
    const now = Date.now();
    const current = this.memoryLocks.get(key);
    if (current && current.expiresAt > now && current.owner !== owner) {
      return false;
    }
    this.memoryLocks.set(key, { owner, expiresAt: now + ttlMs });
    return true;
  }
}
