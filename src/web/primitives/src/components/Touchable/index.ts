/**
 * Touchable primitive component entry point
 * 
 * This file exports the Touchable component and its props interface,
 * providing a clean API surface for consumers of the design system.
 * 
 * @example Import and use
 * ```tsx
 * import { Touchable } from '@design-system/primitives';
 * 
 * <Touchable onPress={() => console.log('Pressed')}>
 *   <Text>Press me</Text>
 * </Touchable>
 * ```
 */

import { Touchable, TouchableProps } from './Touchable';

export { Touchable, TouchableProps };
export default Touchable;