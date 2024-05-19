import { Injectable } from '@nestjs/common';
import { createClient } from '@redis/client';
import { logger } from 'src/logger';

@Injectable()
export default class RedisService {
  private redisClient;
  private isReady: boolean = false;

  async set(key: string, value: unknown): Promise<void> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      await this.redisClient.set(key, value);
    } catch (error) {
      logger.error('Error in set operation:', {
        detail: error.message,
      });
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      return await this.redisClient.get(key);
    } catch (error) {
      logger.error('Error in get operation:', {
        detail: error.message,
      });
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      await this.redisClient.del(key);
      return 1;
    } catch (error) {
      logger.error('Error in delete operation:', {
        detail: error.message,
      });
      return 0;
    }
  }

  async incrby(key: string, count: number): Promise<number> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      return await this.redisClient.incr(key, count);
    } catch (error) {
      logger.error('Error in incrby operation:', {
        detail: error.message,
      });
      return null;
    }
  }

  async decrby(key: string, count: number): Promise<number> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      return await this.redisClient.decr(key, count);
    } catch (error) {
      logger.error('Error in decrby operation:', {
        detail: error.message,
      });
      return null;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      return await this.redisClient.exists(key);
    } catch (error) {
      logger.error('Error in exists operation:', {
        detail: error.message,
      });
      return null;
    }
  }

  async setnx(key: string, value: unknown): Promise<number> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      const exists = await this.exists(key);
      if (exists) {
        return 0;
      }
      await this.set(key, value);
      return 1;
    } catch (error) {
      logger.error('Error in setnx operation:', {
        detail: error.message,
      });
      return -1;
    }
  }

  private async initClient() {
    const client = createClient({
      socket: {
        reconnectStrategy: (retries) => {
          if (retries < 5) {
            return 0;
          }
          throw new Error('No more retries remaining, giving up.');
        },
      },
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    client.on('ready', () => {
      this.isReady = true;
    });
    client.on('error', () => {
      this.isReady = false;
    });

    await client.connect().catch((err) => {
      logger.error('Error connecting to Redis:', {
        detail: err.message,
      });
    });

    return client;
  }
}
