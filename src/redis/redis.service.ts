import { Injectable } from '@nestjs/common';
import { createClient } from '@redis/client';

@Injectable()
export default class RedisService {
  private redisClient;
  private isReady;
  async set(key: string, value: unknown, expire): Promise<void> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      await this.redisClient.set(key, value, {
        EX: expire,
      });
    } catch (error) {
      return;
    }
  }

  async get(key: string): Promise<string> {
    try {
      if (!this.isReady) {
        this.redisClient = await this.initClient();
      }
      return await this.redisClient.get(key);
    } catch (error) {
      return null;
    }
  }

  async initClient() {
    const client = createClient({
      socket: {
        reconnectStrategy: (retries) => {
          if (retries < 5) {
            return 0;
          }

          return new Error('No more retries remaining, giving up.');
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
      console.log(err);
    });
    return client;
  }
}
