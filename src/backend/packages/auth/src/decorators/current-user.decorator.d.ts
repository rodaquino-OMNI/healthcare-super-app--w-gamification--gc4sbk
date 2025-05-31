import { ExecutionContext, PipeTransform, Type } from '@nestjs/common';

/**
 * Parameter decorator factory that extracts the authenticated user from the request object.
 * 
 * This decorator simplifies access to user data in controller methods. The user object must be 
 * attached to the request by an authentication middleware or guard (typically JwtAuthGuard) 
 * before this decorator can access it.
 *
 * @example
 * // Get the entire user object
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 *
 * @example
 * // Get a specific property from the user object
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id') userId: string) {
 *   return { userId };
 * }
 *
 * @example
 * // Use with a pipe for validation
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser(new ValidationPipe()) user: User) {
 *   return user;
 * }
 *
 * @example
 * // Get a specific property with a pipe
 * @Get('user-id')
 * @UseGuards(JwtAuthGuard)
 * getUserId(@CurrentUser('id', new ValidationPipe()) userId: string) {
 *   return { userId };
 * }
 */
export declare const CurrentUser: {
  /**
   * Parameter decorator that extracts the authenticated user from the request object.
   * Returns the entire user object.
   */
  (): ParameterDecorator;

  /**
   * Parameter decorator that extracts a specific property from the authenticated user.
   * @param data - The property name to extract from the user object
   */
  (data: string): ParameterDecorator;

  /**
   * Parameter decorator that extracts the authenticated user and passes it through provided pipes.
   * @param pipes - One or more pipes to process the user object
   */
  (...pipes: Array<PipeTransform<any, any> | Type<PipeTransform<any, any>>>): ParameterDecorator;

  /**
   * Parameter decorator that extracts a specific property from the authenticated user and passes it through provided pipes.
   * @param data - The property name to extract from the user object
   * @param pipes - One or more pipes to process the extracted property
   */
  (data: string, ...pipes: Array<PipeTransform<any, any> | Type<PipeTransform<any, any>>>): ParameterDecorator;
};