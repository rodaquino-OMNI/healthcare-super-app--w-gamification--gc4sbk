import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';

/**
 * Creates and configures a NestJS test application for API Gateway E2E tests.
 * 
 * @param options Configuration options for the test application
 * @returns A configured NestJS application instance
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  // Create a testing module with the AppModule
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Apply any provider overrides from options
  if (options.overrides) {
    for (const override of options.overrides) {
      moduleBuilder.overrideProvider(override.provider)
        .useValue(override.value);
    }
  }

  // Compile the module
  const moduleFixture: TestingModule = await moduleBuilder.compile();

  // Create and initialize the application
  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}

/**
 * Options for creating a test application
 */
export interface TestAppOptions {
  /**
   * Provider overrides to apply to the test module
   */
  overrides?: ProviderOverride[];
}

/**
 * Provider override configuration
 */
export interface ProviderOverride {
  /**
   * The provider token to override
   */
  provider: string;

  /**
   * The mock value to use for the provider
   */
  value: any;
}