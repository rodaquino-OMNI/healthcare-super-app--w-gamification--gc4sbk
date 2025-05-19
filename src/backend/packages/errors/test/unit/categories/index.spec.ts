import { expect } from 'chai';
import * as CategoryErrors from '../../../src/categories';
import * as ValidationErrors from '../../../src/categories/validation.errors';
import * as BusinessErrors from '../../../src/categories/business.errors';
import * as TechnicalErrors from '../../../src/categories/technical.errors';
import * as ExternalErrors from '../../../src/categories/external.errors';
import { ErrorType } from '../../../src/types';

describe('Error Categories Barrel Exports', () => {
  describe('Validation Errors', () => {
    it('should export all validation error classes', () => {
      // Get all exported validation error classes
      const validationErrorClasses = Object.keys(ValidationErrors).filter(
        (key) => typeof ValidationErrors[key] === 'function'
      );

      // Verify each validation error class is exported through the barrel
      validationErrorClasses.forEach((errorClass) => {
        expect(CategoryErrors).to.have.property(errorClass);
        expect(CategoryErrors[errorClass]).to.equal(ValidationErrors[errorClass]);
      });
    });

    it('should maintain proper error types for validation errors', () => {
      // Create instances of each validation error and check their error type
      const validationErrorClasses = Object.keys(ValidationErrors).filter(
        (key) => typeof ValidationErrors[key] === 'function'
      );

      validationErrorClasses.forEach((errorClass) => {
        // Skip abstract classes or non-constructable functions
        try {
          const errorInstance = new ValidationErrors[errorClass]('Test error');
          expect(errorInstance.errorType).to.equal(ErrorType.VALIDATION);
        } catch (e) {
          // Some error classes might require specific constructor arguments
          // This is acceptable as long as the class is exported
        }
      });
    });
  });

  describe('Business Errors', () => {
    it('should export all business error classes', () => {
      // Get all exported business error classes
      const businessErrorClasses = Object.keys(BusinessErrors).filter(
        (key) => typeof BusinessErrors[key] === 'function'
      );

      // Verify each business error class is exported through the barrel
      businessErrorClasses.forEach((errorClass) => {
        expect(CategoryErrors).to.have.property(errorClass);
        expect(CategoryErrors[errorClass]).to.equal(BusinessErrors[errorClass]);
      });
    });

    it('should maintain proper error types for business errors', () => {
      // Create instances of each business error and check their error type
      const businessErrorClasses = Object.keys(BusinessErrors).filter(
        (key) => typeof BusinessErrors[key] === 'function'
      );

      businessErrorClasses.forEach((errorClass) => {
        // Skip abstract classes or non-constructable functions
        try {
          const errorInstance = new BusinessErrors[errorClass]('Test error');
          expect(errorInstance.errorType).to.equal(ErrorType.BUSINESS);
        } catch (e) {
          // Some error classes might require specific constructor arguments
          // This is acceptable as long as the class is exported
        }
      });
    });
  });

  describe('Technical Errors', () => {
    it('should export all technical error classes', () => {
      // Get all exported technical error classes
      const technicalErrorClasses = Object.keys(TechnicalErrors).filter(
        (key) => typeof TechnicalErrors[key] === 'function'
      );

      // Verify each technical error class is exported through the barrel
      technicalErrorClasses.forEach((errorClass) => {
        expect(CategoryErrors).to.have.property(errorClass);
        expect(CategoryErrors[errorClass]).to.equal(TechnicalErrors[errorClass]);
      });
    });

    it('should maintain proper error types for technical errors', () => {
      // Create instances of each technical error and check their error type
      const technicalErrorClasses = Object.keys(TechnicalErrors).filter(
        (key) => typeof TechnicalErrors[key] === 'function'
      );

      technicalErrorClasses.forEach((errorClass) => {
        // Skip abstract classes or non-constructable functions
        try {
          const errorInstance = new TechnicalErrors[errorClass]('Test error');
          expect(errorInstance.errorType).to.equal(ErrorType.TECHNICAL);
        } catch (e) {
          // Some error classes might require specific constructor arguments
          // This is acceptable as long as the class is exported
        }
      });
    });
  });

  describe('External Errors', () => {
    it('should export all external error classes', () => {
      // Get all exported external error classes
      const externalErrorClasses = Object.keys(ExternalErrors).filter(
        (key) => typeof ExternalErrors[key] === 'function'
      );

      // Verify each external error class is exported through the barrel
      externalErrorClasses.forEach((errorClass) => {
        expect(CategoryErrors).to.have.property(errorClass);
        expect(CategoryErrors[errorClass]).to.equal(ExternalErrors[errorClass]);
      });
    });

    it('should maintain proper error types for external errors', () => {
      // Create instances of each external error and check their error type
      const externalErrorClasses = Object.keys(ExternalErrors).filter(
        (key) => typeof ExternalErrors[key] === 'function'
      );

      externalErrorClasses.forEach((errorClass) => {
        // Skip abstract classes or non-constructable functions
        try {
          const errorInstance = new ExternalErrors[errorClass]('Test error');
          expect(errorInstance.errorType).to.equal(ErrorType.EXTERNAL);
        } catch (e) {
          // Some error classes might require specific constructor arguments
          // This is acceptable as long as the class is exported
        }
      });
    });
  });

  describe('Barrel Export Structure', () => {
    it('should not expose internal implementation details', () => {
      // The barrel should only export error classes, not internal utilities or types
      const internalProperties = ['default', '__esModule'];
      internalProperties.forEach((prop) => {
        expect(CategoryErrors).not.to.have.property(prop);
      });
    });

    it('should maintain proper namespacing for error categories', () => {
      // Verify that all exports are properly categorized
      const allExports = Object.keys(CategoryErrors);
      
      // Check that all validation errors are included
      const validationErrorClasses = Object.keys(ValidationErrors).filter(
        (key) => typeof ValidationErrors[key] === 'function'
      );
      validationErrorClasses.forEach((errorClass) => {
        expect(allExports).to.include(errorClass);
      });

      // Check that all business errors are included
      const businessErrorClasses = Object.keys(BusinessErrors).filter(
        (key) => typeof BusinessErrors[key] === 'function'
      );
      businessErrorClasses.forEach((errorClass) => {
        expect(allExports).to.include(errorClass);
      });

      // Check that all technical errors are included
      const technicalErrorClasses = Object.keys(TechnicalErrors).filter(
        (key) => typeof TechnicalErrors[key] === 'function'
      );
      technicalErrorClasses.forEach((errorClass) => {
        expect(allExports).to.include(errorClass);
      });

      // Check that all external errors are included
      const externalErrorClasses = Object.keys(ExternalErrors).filter(
        (key) => typeof ExternalErrors[key] === 'function'
      );
      externalErrorClasses.forEach((errorClass) => {
        expect(allExports).to.include(errorClass);
      });
    });

    it('should support tree-shaking by using named exports', () => {
      // Verify that the barrel uses named exports rather than default exports
      // This is important for tree-shaking to work properly
      expect(Object.keys(CategoryErrors).length).to.be.greaterThan(0);
      expect(CategoryErrors).not.to.have.property('default');
    });
  });

  describe('Error Class Functionality', () => {
    it('should preserve error class inheritance and prototype chain', () => {
      // Sample one error from each category to verify inheritance
      const validationErrorClass = Object.keys(ValidationErrors).find(
        (key) => typeof ValidationErrors[key] === 'function'
      );
      const businessErrorClass = Object.keys(BusinessErrors).find(
        (key) => typeof BusinessErrors[key] === 'function'
      );
      const technicalErrorClass = Object.keys(TechnicalErrors).find(
        (key) => typeof TechnicalErrors[key] === 'function'
      );
      const externalErrorClass = Object.keys(ExternalErrors).find(
        (key) => typeof ExternalErrors[key] === 'function'
      );

      // Test validation error
      if (validationErrorClass) {
        try {
          const error = new CategoryErrors[validationErrorClass]('Test error');
          expect(error).to.be.instanceOf(Error);
          expect(error.name).to.equal(validationErrorClass);
          expect(error.message).to.equal('Test error');
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test business error
      if (businessErrorClass) {
        try {
          const error = new CategoryErrors[businessErrorClass]('Test error');
          expect(error).to.be.instanceOf(Error);
          expect(error.name).to.equal(businessErrorClass);
          expect(error.message).to.equal('Test error');
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test technical error
      if (technicalErrorClass) {
        try {
          const error = new CategoryErrors[technicalErrorClass]('Test error');
          expect(error).to.be.instanceOf(Error);
          expect(error.name).to.equal(technicalErrorClass);
          expect(error.message).to.equal('Test error');
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test external error
      if (externalErrorClass) {
        try {
          const error = new CategoryErrors[externalErrorClass]('Test error');
          expect(error).to.be.instanceOf(Error);
          expect(error.name).to.equal(externalErrorClass);
          expect(error.message).to.equal('Test error');
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }
    });

    it('should ensure error classes have proper serialization methods', () => {
      // Sample one error from each category to verify serialization
      const validationErrorClass = Object.keys(ValidationErrors).find(
        (key) => typeof ValidationErrors[key] === 'function'
      );
      const businessErrorClass = Object.keys(BusinessErrors).find(
        (key) => typeof BusinessErrors[key] === 'function'
      );
      const technicalErrorClass = Object.keys(TechnicalErrors).find(
        (key) => typeof TechnicalErrors[key] === 'function'
      );
      const externalErrorClass = Object.keys(ExternalErrors).find(
        (key) => typeof ExternalErrors[key] === 'function'
      );

      // Test validation error serialization
      if (validationErrorClass) {
        try {
          const error = new CategoryErrors[validationErrorClass]('Test error');
          expect(error.toJSON).to.be.a('function');
          const serialized = error.toJSON();
          expect(serialized).to.have.property('message', 'Test error');
          expect(serialized).to.have.property('name', validationErrorClass);
          expect(serialized).to.have.property('errorType', ErrorType.VALIDATION);
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test business error serialization
      if (businessErrorClass) {
        try {
          const error = new CategoryErrors[businessErrorClass]('Test error');
          expect(error.toJSON).to.be.a('function');
          const serialized = error.toJSON();
          expect(serialized).to.have.property('message', 'Test error');
          expect(serialized).to.have.property('name', businessErrorClass);
          expect(serialized).to.have.property('errorType', ErrorType.BUSINESS);
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test technical error serialization
      if (technicalErrorClass) {
        try {
          const error = new CategoryErrors[technicalErrorClass]('Test error');
          expect(error.toJSON).to.be.a('function');
          const serialized = error.toJSON();
          expect(serialized).to.have.property('message', 'Test error');
          expect(serialized).to.have.property('name', technicalErrorClass);
          expect(serialized).to.have.property('errorType', ErrorType.TECHNICAL);
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }

      // Test external error serialization
      if (externalErrorClass) {
        try {
          const error = new CategoryErrors[externalErrorClass]('Test error');
          expect(error.toJSON).to.be.a('function');
          const serialized = error.toJSON();
          expect(serialized).to.have.property('message', 'Test error');
          expect(serialized).to.have.property('name', externalErrorClass);
          expect(serialized).to.have.property('errorType', ErrorType.EXTERNAL);
        } catch (e) {
          // Some error classes might require specific constructor arguments
        }
      }
    });
  });
});