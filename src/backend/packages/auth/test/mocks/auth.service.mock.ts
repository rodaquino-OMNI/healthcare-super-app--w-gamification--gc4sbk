import { IAuthService } from '../../src/interfaces/services.interface';
import { TokenResponseDto } from '../../src/dto/token-response.dto';
import { RefreshTokenDto } from '../../src/dto/refresh-token.dto';
import { User } from '@austa/interfaces/auth';

/**
 * Mock implementation of the AuthService for testing purposes.
 * 
 * This mock provides configurable responses for different test scenarios without
 * relying on actual database, token, or external provider dependencies. It enables
 * comprehensive testing of components that depend on the AuthService.
 * 
 * Usage example:
 * ```typescript
 * // Configure the mock for a test scenario
 * const authServiceMock = new MockAuthService();
 * 
 * // Configure successful authentication
 * authServiceMock.setValidateCredentialsResponse(mockUser);
 * authServiceMock.setGenerateTokensResponse(mockTokenResponse);
 * 
 * // Or configure authentication failure
 * authServiceMock.setValidateCredentialsError(new UnauthorizedException('Invalid credentials'));
 * 
 * // Use in your test module
 * const moduleRef = await Test.createTestingModule({
 *   providers: [
 *     {
 *       provide: AuthService,
 *       useValue: authServiceMock,
 *     },
 *   ],
 * }).compile();
 * ```
 */
export class MockAuthService implements IAuthService {
  // Mock response storage
  private validateCredentialsResponse: User | null = null;
  private validateCredentialsError: Error | null = null;
  
  private generateTokensResponse: TokenResponseDto | null = null;
  private generateTokensError: Error | null = null;
  
  private refreshTokensResponse: TokenResponseDto | null = null;
  private refreshTokensError: Error | null = null;
  
  private logoutResponse: boolean = true;
  private logoutError: Error | null = null;
  
  private validateTokenResponse: User | null = null;
  private validateTokenError: Error | null = null;

  // Mock user storage for simulating a user database
  private mockUsers: Map<string, User> = new Map();
  
  // Mock token storage for simulating token validation
  private validTokens: Set<string> = new Set();
  private invalidatedTokens: Set<string> = new Set();

  /**
   * Validates user credentials for authentication
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns A promise resolving to the authenticated user if credentials are valid
   * @throws Error if configured to return an error
   */
  async validateCredentials(email: string, password: string): Promise<User> {
    if (this.validateCredentialsError) {
      throw this.validateCredentialsError;
    }
    
    // If a specific response is configured, return it
    if (this.validateCredentialsResponse) {
      return this.validateCredentialsResponse;
    }
    
    // Otherwise, check the mock user database
    const user = Array.from(this.mockUsers.values()).find(u => 
      u.email === email && (password === 'correct-password' || password === u.password)
    );
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    return user;
  }
  
  /**
   * Generates authentication tokens for the authenticated user
   * 
   * @param user - The authenticated user
   * @returns A promise resolving to the token response containing access and refresh tokens
   * @throws Error if configured to return an error
   */
  async generateTokens(user: User): Promise<TokenResponseDto> {
    if (this.generateTokensError) {
      throw this.generateTokensError;
    }
    
    if (this.generateTokensResponse) {
      return this.generateTokensResponse;
    }
    
    // Generate a mock token response
    const accessToken = `mock-access-token-${user.id}-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${user.id}-${Date.now()}`;
    
    // Add to valid tokens
    this.validTokens.add(accessToken);
    this.validTokens.add(refreshToken);
    
    return TokenResponseDto.fromTokenData(
      accessToken,
      refreshToken,
      3600 // 1 hour expiration
    );
  }
  
  /**
   * Validates a refresh token and issues new access and refresh tokens
   * 
   * @param refreshTokenDto - The refresh token DTO containing the token to validate
   * @returns A promise resolving to a new token response containing access and refresh tokens
   * @throws Error if configured to return an error or if the token is invalid
   */
  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    if (this.refreshTokensError) {
      throw this.refreshTokensError;
    }
    
    if (this.refreshTokensResponse) {
      return this.refreshTokensResponse;
    }
    
    const { refreshToken } = refreshTokenDto;
    
    // Check if token is valid
    if (!this.validTokens.has(refreshToken) || this.invalidatedTokens.has(refreshToken)) {
      throw new Error('Invalid refresh token');
    }
    
    // Invalidate the old refresh token (token rotation)
    this.invalidatedTokens.add(refreshToken);
    this.validTokens.delete(refreshToken);
    
    // Extract user ID from token (mock implementation)
    const userId = refreshToken.split('-')[2];
    const user = this.mockUsers.get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new tokens
    return this.generateTokens(user);
  }
  
  /**
   * Invalidates all tokens for a user (logout)
   * 
   * @param userId - The ID of the user to logout
   * @param refreshToken - Optional refresh token to invalidate specifically
   * @returns A promise resolving to true if successful
   * @throws Error if configured to return an error
   */
  async logout(userId: string, refreshToken?: string): Promise<boolean> {
    if (this.logoutError) {
      throw this.logoutError;
    }
    
    // If a specific refresh token is provided, invalidate only that token
    if (refreshToken) {
      this.invalidatedTokens.add(refreshToken);
      this.validTokens.delete(refreshToken);
    } else {
      // Invalidate all tokens for the user (simplified implementation)
      // In a real implementation, we would query all tokens for the user
      Array.from(this.validTokens).forEach(token => {
        if (token.includes(`-${userId}-`)) {
          this.invalidatedTokens.add(token);
          this.validTokens.delete(token);
        }
      });
    }
    
    return this.logoutResponse;
  }
  
  /**
   * Validates a JWT access token
   * 
   * @param token - The JWT access token to validate
   * @returns A promise resolving to the decoded user data if valid
   * @throws Error if configured to return an error or if the token is invalid
   */
  async validateToken(token: string): Promise<User> {
    if (this.validateTokenError) {
      throw this.validateTokenError;
    }
    
    if (this.validateTokenResponse) {
      return this.validateTokenResponse;
    }
    
    // Check if token is valid
    if (!this.validTokens.has(token) || this.invalidatedTokens.has(token)) {
      throw new Error('Invalid token');
    }
    
    // Extract user ID from token (mock implementation)
    const userId = token.split('-')[2];
    const user = this.mockUsers.get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  // Configuration methods for tests
  
  /**
   * Configures the response for validateCredentials
   * @param user The user to return from validateCredentials
   */
  setValidateCredentialsResponse(user: User): void {
    this.validateCredentialsResponse = user;
    this.validateCredentialsError = null;
  }
  
  /**
   * Configures validateCredentials to throw an error
   * @param error The error to throw
   */
  setValidateCredentialsError(error: Error): void {
    this.validateCredentialsError = error;
    this.validateCredentialsResponse = null;
  }
  
  /**
   * Configures the response for generateTokens
   * @param tokenResponse The token response to return
   */
  setGenerateTokensResponse(tokenResponse: TokenResponseDto): void {
    this.generateTokensResponse = tokenResponse;
    this.generateTokensError = null;
  }
  
  /**
   * Configures generateTokens to throw an error
   * @param error The error to throw
   */
  setGenerateTokensError(error: Error): void {
    this.generateTokensError = error;
    this.generateTokensResponse = null;
  }
  
  /**
   * Configures the response for refreshTokens
   * @param tokenResponse The token response to return
   */
  setRefreshTokensResponse(tokenResponse: TokenResponseDto): void {
    this.refreshTokensResponse = tokenResponse;
    this.refreshTokensError = null;
  }
  
  /**
   * Configures refreshTokens to throw an error
   * @param error The error to throw
   */
  setRefreshTokensError(error: Error): void {
    this.refreshTokensError = error;
    this.refreshTokensResponse = null;
  }
  
  /**
   * Configures the response for logout
   * @param success Whether logout should succeed
   */
  setLogoutResponse(success: boolean): void {
    this.logoutResponse = success;
    this.logoutError = null;
  }
  
  /**
   * Configures logout to throw an error
   * @param error The error to throw
   */
  setLogoutError(error: Error): void {
    this.logoutError = error;
  }
  
  /**
   * Configures the response for validateToken
   * @param user The user to return from validateToken
   */
  setValidateTokenResponse(user: User): void {
    this.validateTokenResponse = user;
    this.validateTokenError = null;
  }
  
  /**
   * Configures validateToken to throw an error
   * @param error The error to throw
   */
  setValidateTokenError(error: Error): void {
    this.validateTokenError = error;
    this.validateTokenResponse = null;
  }
  
  /**
   * Adds a mock user to the internal user database
   * @param user The user to add
   */
  addMockUser(user: User): void {
    this.mockUsers.set(user.id, user);
  }
  
  /**
   * Removes a mock user from the internal user database
   * @param userId The ID of the user to remove
   */
  removeMockUser(userId: string): void {
    this.mockUsers.delete(userId);
  }
  
  /**
   * Clears all mock users
   */
  clearMockUsers(): void {
    this.mockUsers.clear();
  }
  
  /**
   * Adds a token to the set of valid tokens
   * @param token The token to add
   */
  addValidToken(token: string): void {
    this.validTokens.add(token);
    this.invalidatedTokens.delete(token);
  }
  
  /**
   * Invalidates a token
   * @param token The token to invalidate
   */
  invalidateToken(token: string): void {
    this.validTokens.delete(token);
    this.invalidatedTokens.add(token);
  }
  
  /**
   * Clears all token state
   */
  clearTokenState(): void {
    this.validTokens.clear();
    this.invalidatedTokens.clear();
  }
  
  /**
   * Resets all mock configurations to their default state
   */
  reset(): void {
    this.validateCredentialsResponse = null;
    this.validateCredentialsError = null;
    
    this.generateTokensResponse = null;
    this.generateTokensError = null;
    
    this.refreshTokensResponse = null;
    this.refreshTokensError = null;
    
    this.logoutResponse = true;
    this.logoutError = null;
    
    this.validateTokenResponse = null;
    this.validateTokenError = null;
    
    this.clearMockUsers();
    this.clearTokenState();
  }
  
  /**
   * Creates a mock user with the given properties
   * @param props User properties
   * @returns A mock user object
   */
  createMockUser(props: Partial<User> & { email: string }): User {
    const id = props.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const user: User = {
      id,
      name: props.name || `Test User ${id}`,
      email: props.email,
      password: props.password || 'hashed-password',
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
      ...props
    };
    
    this.addMockUser(user);
    return user;
  }
  
  /**
   * Simulates a successful login flow
   * @param email User email
   * @param password User password
   * @returns Token response and user
   * @throws Error if login fails
   */
  async simulateLogin(email: string, password: string): Promise<{ tokens: TokenResponseDto, user: User }> {
    const user = await this.validateCredentials(email, password);
    const tokens = await this.generateTokens(user);
    return { tokens, user };
  }
  
  /**
   * Simulates a successful registration and login flow
   * @param userData User data for registration
   * @returns Token response and created user
   */
  async simulateRegistration(userData: { email: string, password: string, name: string }): Promise<{ tokens: TokenResponseDto, user: User }> {
    const user = this.createMockUser({
      email: userData.email,
      password: userData.password,
      name: userData.name
    });
    
    const tokens = await this.generateTokens(user);
    return { tokens, user };
  }
}