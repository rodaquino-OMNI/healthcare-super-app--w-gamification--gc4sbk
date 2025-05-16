import { ExecutionContext, PipeTransform, Type } from '@nestjs/common';

/**
 * Parameter decorator factory that extracts the authenticated user from the request object.
 * 
 * This decorator simplifies access to user data in controller methods by extracting the user
 * object attached to the request by authentication middleware or guards (typically JwtAuthGuard).
 * 
 * @remarks
 * The decorator can be used in two ways:
 * 1. Without arguments to get the entire user object
 * 2. With a string argument to extract a specific property from the user object
 * 
 * It also supports pipe transforms for validation or transformation of the extracted user data.
 * 
 * @example
 * ```typescript
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * 
 * // Get a specific property from the user object
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 * 
 * // With validation pipe
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser(new ValidationPipe()) user: User) {
 *   return user;
 * }
 * ```
 */
export declare const CurrentUser: {
  /**
   * Parameter decorator that extracts the authenticated user from the request.
   * 
   * @param dataOrPipes - Optional property path to extract from the user object or pipes to apply
   * @returns A parameter decorator function
   */
  (...dataOrPipes: []): ParameterDecorator;
  
  /**
   * Parameter decorator that extracts the authenticated user from the request.
   * 
   * @param dataOrPipes - Property path to extract from the user object and/or pipes to apply
   * @returns A parameter decorator function
   */
  (...dataOrPipes: (string | PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
  
  /**
   * Parameter decorator that extracts the authenticated user from the request.
   * 
   * @param data - Property path to extract from the user object
   * @param pipes - Pipes to apply to the extracted user data
   * @returns A parameter decorator function
   */
  (data: string, ...pipes: (PipeTransform<any, any> | Type<PipeTransform<any, any>>)[]): ParameterDecorator;
};