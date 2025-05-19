import React from 'react';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { ProgressCircleProps } from '@austa/interfaces/components/core.types';

/**
 * ProgressCircle is a component that displays progress as a circle.
 * It can be used to show completion percentage of tasks, goals, or other progress indicators.
 * 
 * @example
 * // Basic usage
 * <ProgressCircle progress={75} />
 * 
 * @example
 * // With journey-specific theming
 * <ProgressCircle progress={50} journey="health" />
 * 
 * @example
 * // With custom color and size
 * <ProgressCircle progress={50} color="journeys.health.primary" size="lg" />
 * 
 * @example
 * // With progress label
 * <ProgressCircle progress={85} showLabel={true} />
 */
export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  color,
  size = '64px',
  showLabel = false,
  journey,
  ariaLabel,
  testID,
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  // Set default color based on journey if provided, otherwise use brand.primary
  const progressColor = color || (journey ? `journeys.${journey}.primary` : 'brand.primary');
  
  // Calculate SVG parameters
  const viewBoxSize = 36; // viewBox size
  const strokeWidth = 3.6; // 10% of viewBoxSize
  const radius = (viewBoxSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;
  
  // Center position for the circle
  const center = viewBoxSize / 2;
  
  return (
    <Box
      position="relative"
      width={size}
      height={size}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      journey={journey}
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `${normalizedProgress}% complete`}
      role="progressbar"
      testID={testID}
      data-testid={testID}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="neutral.gray300"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      
      {showLabel && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          style={{ transform: 'translate(-50%, -50%)' }}
          aria-hidden="true"
        >
          <Text
            fontSize="sm"
            fontWeight="medium"
            journey={journey}
            aria-hidden="true"
          >
            {`${Math.round(normalizedProgress)}%`}
          </Text>
        </Box>
      )}
    </Box>
  );
};