import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseFilters, HttpCode, HttpStatus, Query, Patch } from '@nestjs/common'; // v10.3.0+
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard, RolesGuard } from '@app/auth/guards';
import { Roles } from '@app/auth/decorators';
import { GlobalExceptionFilter } from '@austa/errors/nest';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';

/**
 * Handles incoming requests related to appointments.
 * It uses the AppointmentsService to perform the actual business logic and interacts with the authentication and authorization middleware to ensure proper access control.
 */
@Controller('appointments')
@UseFilters(GlobalExceptionFilter)
export class AppointmentsController {
  /**
   * Initializes the AppointmentsController.
   * @param appointmentsService The service responsible for appointment-related business logic.
   */
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Creates a new appointment.
   * @param createAppointmentDto Data transfer object containing appointment information.
   * @returns The newly created appointment.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createAppointmentDto: CreateAppointmentDto) {
    // Calls the `create` method of the `appointmentsService` to create the appointment.
    return await this.appointmentsService.create(createAppointmentDto);
    // Returns the created appointment.
  }

  /**
   * Retrieves all appointments based on optional filters and pagination.
   * @param query Query parameters for filtering and pagination.
   * @returns A list of appointments.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(@Query() query: FindAppointmentsQueryDto) {
    // Calls the `findAll` method of the `appointmentsService` to retrieve the appointments.
    return await this.appointmentsService.findAll(query);
    // Returns the list of appointments.
  }

  /**
   * Retrieves a single appointment by ID.
   * @param id The ID of the appointment to retrieve.
   * @returns The requested appointment.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string) {
    // Calls the `findOne` method of the `appointmentsService` to retrieve the appointment.
    return await this.appointmentsService.findOne(id);
    // Returns the requested appointment.
  }

  /**
   * Updates an existing appointment.
   * @param id The ID of the appointment to update.
   * @param updateAppointmentDto Data transfer object containing updated appointment information.
   * @returns The updated appointment.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto) {
    // Calls the `update` method of the `appointmentsService` to update the appointment.
    return await this.appointmentsService.update(id, updateAppointmentDto);
    // Returns the updated appointment.
  }

  /**
   * Deletes an appointment.
   * @param id The ID of the appointment to delete.
   * @returns A promise that resolves when the appointment is deleted.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string) {
    // Calls the `remove` method of the `appointmentsService` to delete the appointment.
    await this.appointmentsService.remove(id);
    // Returns no content (204 status code).
  }
}