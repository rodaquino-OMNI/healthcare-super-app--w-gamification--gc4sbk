/**
 * GraphQL fragment for the User type
 * Provides a reusable selection of basic user fields (id, name, email)
 * for use in various user-related queries throughout the application
 */
import { gql } from '@apollo/client';
import { User } from '@austa/interfaces/auth/user.types';

/**
 * Fragment for the User type containing essential fields
 * Used to ensure consistent field selection when querying user data
 * across the application
 */
export const UserFragment = gql`
  fragment UserFragment on User {
    id
    name
    email
  }
`;