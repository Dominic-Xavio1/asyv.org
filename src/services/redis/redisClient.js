import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Redis Client Singleton
 * 
 * This module provides a single Redis client instance for the entire application.
 * Used for online users tracking and real-time features.
 */
class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  /**
   * Initialize and connect to Redis
   * @returns {Promise<RedisClient>} The Redis client instance
   */
  async connect() {
    if (this.client && this.isConnected) {
      return this.client;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client: Connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis Client: Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis Client: Connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Get the Redis client instance
   * @returns {Promise<RedisClientType>} The Redis client
   */
  async getClient() {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    return this.client;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      this.client = null;
    }
  }

  /**
   * Check if Redis is connected
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
const redisClient = new RedisClient();

export default redisClient;
