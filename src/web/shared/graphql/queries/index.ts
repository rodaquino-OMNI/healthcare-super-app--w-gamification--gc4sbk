import { gql } from '@apollo/client';

// Query to get a user by ID
export const GET_USER_BY_ID = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

// Query to get all users
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    users {
      id
      name
      email
    }
  }
`;

// Export all queries from domain-specific files
export * from './auth.queries';
export * from './gamification.queries';
export * from './health.queries';
export * from './plan.queries';
export * from './care.queries';