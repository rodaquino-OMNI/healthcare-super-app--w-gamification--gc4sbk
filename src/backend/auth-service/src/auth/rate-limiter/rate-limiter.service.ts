import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@austa/logging';
import { BusinessRuleViolationError } from '@austa/errors/categories';
import { RedisService } from '@app/auth/redis/redis.service';

/**
 * Service responsible for rate limiting authentication attempts
 * to protect against brute force attacks.
 */
@Injectable()
export class RateLimiterService {
  private readonly maxAttempts: number;
  private readonly blockDuration: number;
  private readonly keyPrefix = 'auth:ratelimit:';

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
  ) {
    // Load configuration with defaults
    this.maxAttempts = this.configService.get<number>('auth.rateLimit.maxAttempts', 5);
    this.blockDuration = this.configService.get<number>('auth.rateLimit.blockDurationSeconds', 300); // 5 minutes
  }

  /**
   * Generates a unique key for rate limiting based on IP and email
   * @param ip Client IP address
   * @param email User email address
   * @returns Redis key for rate limiting
   */
  private getKey(ip: string, email: string): string {
    return `${this.keyPrefix}${ip}:${email}`;
  }

  /**
   * Checks if the current authentication attempt is within rate limits
   * @param ip Client IP address
   * @param email User email address
   * @throws BusinessRuleViolationError if rate limit is exceeded
   */
  async checkRateLimit(ip: string, email: string): Promise<void> {
    const key = this.getKey(ip, email);
    
    // Get current attempt count and block expiration
    const [attemptsStr, blockExpiresStr] = await Promise.all([
      this.redisService.get(`${key}:attempts`),
      this.redisService.get(`${key}:blockExpires`),
    ]);
    
    const attempts = parseInt(attemptsStr || '0', 10);
    const blockExpires = parseInt(blockExpiresStr || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    
    // Check if currently blocked
    if (blockExpires > now) {
      const remainingSeconds = blockExpires - now;
      const minutes = Math.ceil(remainingSeconds / 60);
      
      this.logger.warn(
        `Rate limit exceeded: Account temporarily locked`,
        {
          context: 'RateLimiterService',
          ip,
          email,
          remainingSeconds,
        }
      );
      
      throw new BusinessRuleViolationError(
        `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
        {
          rule: 'AUTH_RATE_LIMIT',
          retryAfter: remainingSeconds,
        }
      );
    }
    
    // Check if approaching limit
    if (attempts >= this.maxAttempts - 2 && attempts < this.maxAttempts) {
      this.logger.warn(
        `Rate limit warning: Approaching maximum attempts`,
        {
          context: 'RateLimiterService',
          ip,
          email,
          attempts,
          maxAttempts: this.maxAttempts,
        }
      );
    }
  }

  /**
   * Records a failed authentication attempt and applies rate limiting if needed
   * @param ip Client IP address
   * @param email User email address
   */
  async recordFailedAttempt(ip: string, email: string): Promise<void> {
    const key = this.getKey(ip, email);
    const attemptsKey = `${key}:attempts`;
    const blockKey = `${key}:blockExpires`;
    
    // Increment attempt counter
    const attempts = await this.redisService.incr(attemptsKey);
    
    // Set expiration for attempt counter if not already set
    await this.redisService.expire(attemptsKey, 24 * 60 * 60); // 24 hours
    
    // If max attempts reached, block for configured duration with exponential backoff
    if (attempts >= this.maxAttempts) {
      // Calculate block duration with exponential backoff
      // Formula: base_duration * 2^(attempts - max_attempts) with a maximum of 24 hours
      const factor = Math.min(Math.pow(2, attempts - this.maxAttempts), 288); // Max 24 hours (288 * 5 minutes)
      const blockDuration = this.blockDuration * factor;
      
      const now = Math.floor(Date.now() / 1000);
      const blockExpires = now + blockDuration;
      
      await Promise.all([
        this.redisService.set(blockKey, blockExpires.toString()),
        this.redisService.expire(blockKey, blockDuration),
      ]);
      
      this.logger.warn(
        `Rate limit applied: Account temporarily locked`,
        {
          context: 'RateLimiterService',
          ip,
          email,
          attempts,
          blockDuration,
          blockExpires,
        }
      );
    }
  }

  /**
   * Resets the rate limit counter on successful authentication
   * @param ip Client IP address
   * @param email User email address
   */
  async resetRateLimit(ip: string, email: string): Promise<void> {
    const key = this.getKey(ip, email);
    
    await Promise.all([
      this.redisService.del(`${key}:attempts`),
      this.redisService.del(`${key}:blockExpires`),
    ]);
    
    this.logger.debug(
      `Rate limit reset after successful authentication`,
      {
        context: 'RateLimiterService',
        ip,
        email,
      }
    );
  }
}