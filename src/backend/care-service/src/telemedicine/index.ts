/**
 * Telemedicine Module Public API
 * 
 * This barrel file exports all components of the telemedicine module with a clean public API.
 * It facilitates standardized imports across the application and provides proper module encapsulation.
 */

// Main module exports
export { TelemedicineModule } from './telemedicine.module';
export { TelemedicineController } from './telemedicine.controller';
export { TelemedicineService } from './telemedicine.service';

// DTO exports
export { CreateSessionDto } from './dto/create-session.dto';

// Entity exports
export { TelemedicineSession } from './entities/telemedicine-session.entity';