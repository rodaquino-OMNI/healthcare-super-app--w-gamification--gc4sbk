/**
 * Barrel file for Role DTOs
 * 
 * This file exports all Data Transfer Objects (DTOs) from the roles module
 * to simplify imports throughout the auth-service. By centralizing all DTO
 * exports in a single file, it becomes easier to import multiple DTOs and
 * maintains a clean module structure.
 */

export * from './create-role.dto';
export * from './update-role.dto';
export * from './query-role.dto';
export * from './assign-permissions.dto';