// This file provides global type declarations for the project
// It helps TypeScript recognize module declarations more effectively

// Reference to our detailed module declarations
/// <reference path="./module-declarations.d.ts" />

// Global type declarations for third-party modules

// Apollo Client
declare module '@apollo/client' {
  // Re-export everything from the module
  export * from '@apollo/client';
}

// Apollo Upload Client
declare module 'apollo-upload-client' {
  // Re-export everything from the module
  export * from 'apollo-upload-client';
}

// Axios
declare module 'axios' {
  // Re-export everything from the module
  export * from 'axios';
}

// React Native
declare module 'react-native' {
  // Re-export everything from the module
  export * from 'react-native';
}

// NetInfo
declare module '@react-native-community/netinfo' {
  // Re-export everything from the module
  export * from '@react-native-community/netinfo';
}

// AUSTA Design System - Main component library
declare module '@austa/design-system' {
  // Re-export everything from the module
  export * from '@austa/design-system';
}

// Design System Primitives - Atomic design elements
declare module '@design-system/primitives' {
  // Re-export everything from the module
  export * from '@design-system/primitives';
}

// AUSTA Interfaces - Shared TypeScript definitions
declare module '@austa/interfaces' {
  // Re-export everything from the module
  export * from '@austa/interfaces';
}

// AUSTA Journey Context - Journey state management
declare module '@austa/journey-context' {
  // Re-export everything from the module
  export * from '@austa/journey-context';
}

// Add global localStorage interface for React Native environment
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
}

declare global {
  var localStorage: Storage;
}

// Declare global namespace for any global types
declare namespace NodeJS {
  interface Global {
    // Add any global types here if needed
  }
}