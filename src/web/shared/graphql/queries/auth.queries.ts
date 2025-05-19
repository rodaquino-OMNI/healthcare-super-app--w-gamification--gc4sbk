import { gql } from '@apollo/client';
import { AuthSession, User } from '@austa/interfaces/auth';
import { GraphQLOperation } from '@austa/interfaces/api/graphql.types';

/**
 * GraphQL mutation for user login
 * Takes email and password as input and returns authentication session
 */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      refreshToken
      user {
        id
        name
        email
        phone
        cpf
        createdAt
        updatedAt
        profile {
          preferences
          settings
          contactInfo
        }
        gameProfile {
          level
          xp
          nextLevelXp
          lastActivity
        }
      }
    }
  }
`;

/**
 * GraphQL mutation for user registration
 * Takes name, email, and password as input and returns authentication session
 */
export const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!, $phone: String, $cpf: String) {
    register(input: { name: $name, email: $email, password: $password, phone: $phone, cpf: $cpf }) {
      token
      refreshToken
      user {
        id
        name
        email
        phone
        cpf
        createdAt
        updatedAt
        profile {
          preferences
          settings
          contactInfo
        }
        gameProfile {
          level
          xp
          nextLevelXp
          lastActivity
        }
      }
    }
  }
`;

/**
 * GraphQL query to retrieve user information by ID
 * If ID is not provided, it retrieves the current authenticated user
 */
export const GET_USER_QUERY = gql`
  query GetUser($id: ID) {
    user(id: $id) {
      id
      name
      email
      phone
      cpf
      createdAt
      updatedAt
      profile {
        preferences
        settings
        contactInfo
      }
      gameProfile {
        level
        xp
        nextLevelXp
        lastActivity
        achievements {
          id
          title
          description
          icon
          unlockedAt
          progress
          total
          journey
        }
        quests {
          id
          title
          description
          progress
          total
          startDate
          endDate
          rewards {
            id
            type
            value
          }
        }
      }
    }
  }
`;

/**
 * Type definitions for GraphQL operations
 * These interfaces ensure type safety when using Apollo Client hooks
 */

// Variables for GraphQL operations
export interface LoginMutationVariables {
  email: string;
  password: string;
}

export interface RegisterMutationVariables {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
}

export interface GetUserQueryVariables {
  id?: string;
}

// Results from GraphQL operations
export interface LoginMutationResult {
  login: AuthSession;
}

export interface RegisterMutationResult {
  register: AuthSession;
}

export interface GetUserQueryResult {
  user: User;
}

// Typed GraphQL operations for use with Apollo Client
export type LoginMutation = GraphQLOperation<LoginMutationResult, LoginMutationVariables>;
export type RegisterMutation = GraphQLOperation<RegisterMutationResult, RegisterMutationVariables>;
export type GetUserQuery = GraphQLOperation<GetUserQueryResult, GetUserQueryVariables>;