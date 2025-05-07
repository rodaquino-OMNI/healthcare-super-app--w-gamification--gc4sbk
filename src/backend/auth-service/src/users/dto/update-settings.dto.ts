import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for updating user settings.
 * Contains a nested object of settings to update.
 */
export class UpdateSettingsDto {
  /**
   * The settings to update.
   * This is a flexible object that can contain any valid JSON data.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  settings: Record<string, any>;
}