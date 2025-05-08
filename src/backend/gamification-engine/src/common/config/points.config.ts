import { registerAs } from '@nestjs/config';
import { PointsConfig } from '../interfaces/config.interfaces';

/**
 * Points configuration for the Gamification Engine.
 * 
 * This module provides settings for gamification points including:
 * - Default point values for different actions
 * - Point limits to prevent abuse
 * 
 * @returns {PointsConfig} The points configuration object
 */
export const pointsConfig = registerAs<PointsConfig>('points', () => ({
  defaultValues: {
    healthMetricRecorded: parseInt(process.env.DEFAULT_POINT_HEALTH_METRIC_RECORDED, 10) || 10,
    appointmentBooked: parseInt(process.env.DEFAULT_POINT_APPOINTMENT_BOOKED, 10) || 20,
    appointmentAttended: parseInt(process.env.DEFAULT_POINT_APPOINTMENT_ATTENDED, 10) || 50,
    claimSubmitted: parseInt(process.env.DEFAULT_POINT_CLAIM_SUBMITTED, 10) || 15,
    goalCompleted: parseInt(process.env.DEFAULT_POINT_GOAL_COMPLETED, 10) || 100,
  },
  limits: {
    maxPointsPerDay: parseInt(process.env.MAX_POINTS_PER_DAY, 10) || 1000,
    maxPointsPerAction: parseInt(process.env.MAX_POINTS_PER_ACTION, 10) || 500,
  },
}));