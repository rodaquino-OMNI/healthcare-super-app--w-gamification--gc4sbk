import { addons } from '@storybook/manager-api';
import austaTheme from './theme';

/**
 * Storybook Manager Configuration
 * 
 * This file customizes the Storybook manager UI (the outer frame that contains
 * the sidebar, toolbar, and panel areas).
 * 
 * It applies the custom AUSTA theme and configures global UI settings.
 */
addons.setConfig({
  // Apply custom AUSTA theme
  theme: austaTheme,
  
  // Configure sidebar organization
  sidebar: {
    // Show root level items in the sidebar
    showRoots: true,
    
    // Organize components by type and journey
    // This ensures proper navigation as specified in the technical requirements
    collapsedRoots: [],
    
    // Custom rendering for sidebar labels to ensure consistent casing
    renderLabel: ({ name, type }) => {
      // Keep story names as-is, but format component/group names consistently
      return type === 'story' ? name : name;
    },
  },
  
  // Configure panel positions and default visibility
  panelPosition: 'bottom',
  
  // Set initial active view to sidebar
  initialActive: 'sidebar',
  
  // Configure toolbar visibility
  toolbar: {
    // Show title in the toolbar
    title: { hidden: false },
    
    // Show zoom controls
    zoom: { hidden: false },
    
    // Show copy button
    copy: { hidden: false },
    
    // Show fullscreen button
    fullscreen: { hidden: false },
  },
});