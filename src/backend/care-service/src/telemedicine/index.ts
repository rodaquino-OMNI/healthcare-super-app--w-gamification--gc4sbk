/**
 * Telemedicine Module Barrel File
 * 
 * This barrel file exports all components of the telemedicine module,
 * providing a clean public API for importing telemedicine functionality
 * across the application with standardized syntax.
 */

// Export the module
export { TelemedicineModule } from './telemedicine.module';

// Export the controller
export { TelemedicineController } from './telemedicine.controller';

// Export the service
export { TelemedicineService } from './telemedicine.service';

// Export DTOs
export { CreateSessionDto } from './dto/create-session.dto';

// Export entities
export { TelemedicineSession } from './entities/telemedicine-session.entity';