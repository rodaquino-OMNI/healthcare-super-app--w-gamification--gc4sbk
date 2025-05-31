import { addons } from '@storybook/manager-api';
import austaTheme from './theme';

addons.setConfig({
  // Apply the custom AUSTA theme to the Storybook UI
  theme: austaTheme,
  
  // Configure panel positions and default visibility
  panelPosition: 'bottom',
  showNav: true,
  showPanel: true,
  enableShortcuts: true,
  isToolshown: true,
  initialActive: 'sidebar',
  
  // Set sidebar organization by component type and journey
  sidebar: {
    showRoots: false,
    collapsedRoots: [],
    renderLabel: ({ name, type }) => {
      // Capitalize journey names for better readability
      if (type === 'root' && ['health', 'care', 'plan', 'gamification'].includes(name.toLowerCase())) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
      return name;
    },
  },
  
  // Configure toolbar visibility
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});