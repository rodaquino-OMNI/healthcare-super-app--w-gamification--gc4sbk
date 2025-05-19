/**
 * Utility functions for converting between different journey data formats
 * 
 * These utilities ensure consistent access to journey data across the application,
 * regardless of the format in which journey information is initially provided.
 */

import { Journey, JourneyId } from '@austa/interfaces';
import { ALL_JOURNEYS } from '@austa/shared/constants/journeys';

/**
 * Converts a journey ID to a full Journey object
 * 
 * @param journeyId - The ID of the journey to convert
 * @returns The full Journey object or undefined if not found
 */
export const journeyIdToJourney = (journeyId: JourneyId | string | null | undefined): Journey | undefined => {
  if (!journeyId) return undefined;
  return ALL_JOURNEYS.find(journey => journey.id === journeyId);
};

/**
 * Converts a journey ID to a full Journey object with fallback to default
 * 
 * @param journeyId - The ID of the journey to convert
 * @param defaultJourney - Optional default journey to return if journeyId is not found
 * @returns The full Journey object or the default journey
 */
export const journeyIdToJourneyWithDefault = (
  journeyId: JourneyId | string | null | undefined,
  defaultJourney: Journey = ALL_JOURNEYS[0]
): Journey => {
  return journeyIdToJourney(journeyId) || defaultJourney;
};

/**
 * Extracts the ID from a Journey object
 * 
 * @param journey - The Journey object to extract the ID from
 * @returns The journey ID or undefined if the journey is invalid
 */
export const journeyToJourneyId = (journey: Journey | null | undefined): JourneyId | undefined => {
  if (!journey || !journey.id) return undefined;
  return journey.id as JourneyId;
};

/**
 * Gets the color associated with a journey
 * 
 * @param journeyId - The ID of the journey
 * @returns The color associated with the journey or undefined if not found
 */
export const getJourneyColor = (journeyId: JourneyId | string | null | undefined): string | undefined => {
  const journey = journeyIdToJourney(journeyId);
  return journey?.color;
};

/**
 * Gets the color associated with a journey with fallback to default
 * 
 * @param journeyId - The ID of the journey
 * @param defaultColor - Optional default color to return if journeyId is not found
 * @returns The color associated with the journey or the default color
 */
export const getJourneyColorWithDefault = (
  journeyId: JourneyId | string | null | undefined,
  defaultColor: string = '#000000'
): string => {
  return getJourneyColor(journeyId) || defaultColor;
};

/**
 * Gets the name associated with a journey
 * 
 * @param journeyId - The ID of the journey
 * @returns The name associated with the journey or undefined if not found
 */
export const getJourneyName = (journeyId: JourneyId | string | null | undefined): string | undefined => {
  const journey = journeyIdToJourney(journeyId);
  return journey?.name;
};

/**
 * Gets the name associated with a journey with fallback to default
 * 
 * @param journeyId - The ID of the journey
 * @param defaultName - Optional default name to return if journeyId is not found
 * @returns The name associated with the journey or the default name
 */
export const getJourneyNameWithDefault = (
  journeyId: JourneyId | string | null | undefined,
  defaultName: string = 'Unknown Journey'
): string => {
  return getJourneyName(journeyId) || defaultName;
};

/**
 * Gets the icon associated with a journey
 * 
 * @param journeyId - The ID of the journey
 * @returns The icon associated with the journey or undefined if not found
 */
export const getJourneyIcon = (journeyId: JourneyId | string | null | undefined): string | undefined => {
  const journey = journeyIdToJourney(journeyId);
  return journey?.icon;
};

/**
 * Gets the icon associated with a journey with fallback to default
 * 
 * @param journeyId - The ID of the journey
 * @param defaultIcon - Optional default icon to return if journeyId is not found
 * @returns The icon associated with the journey or the default icon
 */
export const getJourneyIconWithDefault = (
  journeyId: JourneyId | string | null | undefined,
  defaultIcon: string = 'default-icon'
): string => {
  return getJourneyIcon(journeyId) || defaultIcon;
};

/**
 * Gets the route path associated with a journey
 * 
 * @param journeyId - The ID of the journey
 * @returns The route path associated with the journey or undefined if not found
 */
export const getJourneyPath = (journeyId: JourneyId | string | null | undefined): string | undefined => {
  const journey = journeyIdToJourney(journeyId);
  return journey?.path;
};

/**
 * Gets the route path associated with a journey with fallback to default
 * 
 * @param journeyId - The ID of the journey
 * @param defaultPath - Optional default path to return if journeyId is not found
 * @returns The route path associated with the journey or the default path
 */
export const getJourneyPathWithDefault = (
  journeyId: JourneyId | string | null | undefined,
  defaultPath: string = '/'
): string => {
  return getJourneyPath(journeyId) || defaultPath;
};

/**
 * Gets a specific property from a journey
 * 
 * @param journeyId - The ID of the journey
 * @param propertyName - The name of the property to retrieve
 * @returns The value of the property or undefined if not found
 */
export const getJourneyProperty = <T>(
  journeyId: JourneyId | string | null | undefined,
  propertyName: keyof Journey
): T | undefined => {
  const journey = journeyIdToJourney(journeyId);
  return journey ? (journey[propertyName] as unknown as T) : undefined;
};

/**
 * Gets a specific property from a journey with fallback to default
 * 
 * @param journeyId - The ID of the journey
 * @param propertyName - The name of the property to retrieve
 * @param defaultValue - Optional default value to return if property is not found
 * @returns The value of the property or the default value
 */
export const getJourneyPropertyWithDefault = <T>(
  journeyId: JourneyId | string | null | undefined,
  propertyName: keyof Journey,
  defaultValue: T
): T => {
  return getJourneyProperty<T>(journeyId, propertyName) ?? defaultValue;
};

/**
 * Checks if a journey ID matches a specific journey
 * 
 * @param journeyId - The ID to check
 * @param targetJourneyId - The target journey ID to compare against
 * @returns True if the journeyId matches the targetJourneyId, false otherwise
 */
export const isJourney = (
  journeyId: JourneyId | string | null | undefined,
  targetJourneyId: JourneyId
): boolean => {
  return journeyId === targetJourneyId;
};