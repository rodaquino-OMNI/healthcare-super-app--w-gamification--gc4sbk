import React from 'react';
import { Box } from '@design-system/primitives/components/Box';
import { Text } from '@design-system/primitives/components/Text';
import { ProgressCircleProps } from '@austa/interfaces/components';

/**
 * ProgressCircle is a component that displays progress as a circle.
 * It can be used to show completion percentage of tasks, goals, or other progress indicators.
 * 
 * @example
 * // Basic usage
 * <ProgressCircle value={75} />
 * 
 * @example
 * // With journey-specific theming
 * <ProgressCircle value={50} journeyTheme="health" />
 * 
 * @example
 * // With custom color and size
 * <ProgressCircle value={50} color="journeys.health.primary" size="lg" />
 * 
 * @example
 * // With progress label
 * <ProgressCircle value={85} showValue={true} />
 */
export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  max = 100,
  showValue = false,
  formatValue,
  color,
  backgroundColor = 'neutral.gray300',
  size = 64,
  thickness = 3.6,
  animated = false,
  status,
  indeterminate = false,
  label,
  startAngle = 0,
  clockwise = true,
  journeyTheme,
  accessibilityLabel,
  testID,
  style,
  rnStyle,
  ...rest
}) => {
  // Ensure progress is between 0 and max
  const normalizedValue = Math.max(0, Math.min(max, value));
  const percentage = (normalizedValue / max) * 100;
  
  // Set default color based on journey if provided, otherwise use status or default color
  let progressColor = color;
  
  if (!progressColor) {
    if (status) {
      progressColor = `status.${status}`;
    } else if (journeyTheme && journeyTheme !== 'base') {
      progressColor = `journeys.${journeyTheme}.primary`;
    } else {
      progressColor = 'brand.primary';
    }
  }
  
  // Calculate SVG parameters
  const viewBoxSize = 36; // viewBox size
  const strokeWidth = thickness || 3.6; // Default to 10% of viewBoxSize
  const radius = (viewBoxSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Center position for the circle
  const center = viewBoxSize / 2;
  
  // Format the displayed value
  const displayValue = formatValue ? formatValue(normalizedValue, max) : `${Math.round(percentage)}%`;
  
  // Determine size value based on prop
  let sizeValue: number | string = size;
  if (typeof size === 'string' && ['xs', 'sm', 'md', 'lg', 'xl'].includes(size)) {
    const sizeMap = {
      xs: 32,
      sm: 48,
      md: 64,
      lg: 80,
      xl: 96
    };
    sizeValue = sizeMap[size as keyof typeof sizeMap];
  }
  
  // Calculate rotation based on startAngle and direction
  const rotation = startAngle - 90; // -90 to start at top
  const rotationTransform = `rotate(${rotation} ${center} ${center})`;
  const directionTransform = !clockwise ? `scale(-1, 1) translate(${-viewBoxSize}, 0)` : '';
  const combinedTransform = `${rotationTransform} ${directionTransform}`;
  
  return (
    <Box
      position="relative"
      width={sizeValue}
      height={sizeValue}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      journeyTheme={journeyTheme}
      aria-valuenow={indeterminate ? undefined : normalizedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={displayValue}
      aria-label={accessibilityLabel || `${displayValue} complete`}
      role="progressbar"
      testID={testID}
      style={style}
      rnStyle={rnStyle}
      {...rest}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
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
          strokeDashoffset={indeterminate ? 0 : strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={combinedTransform}
          style={animated ? { transition: 'stroke-dashoffset 0.3s ease-in-out' } : undefined}
          className={indeterminate ? 'progress-circle-indeterminate' : undefined}
        />
      </svg>
      
      {(showValue || label) && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          {showValue && (
            <Text
              fontSize="sm"
              fontWeight="medium"
              journeyTheme={journeyTheme}
              aria-hidden="true"
              textAlign="center"
            >
              {displayValue}
            </Text>
          )}
          
          {label && typeof label === 'string' ? (
            <Text
              fontSize="xs"
              color="text.secondary"
              journeyTheme={journeyTheme}
              aria-hidden="true"
              textAlign="center"
              marginTop={showValue ? 'xs' : undefined}
            >
              {label}
            </Text>
          ) : label}
        </Box>
      )}
    </Box>
  );
};

export default ProgressCircle;