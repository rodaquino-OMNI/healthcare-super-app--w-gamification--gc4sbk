import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseFilters, HttpCode, HttpStatus, Query, Patch } from '@nestjs/common'; // v10.3.0
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard, RolesGuard } from '@app/auth/guards';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { IAppointment } from '@austa/interfaces/journey/care';
import { AUTH_INSUFFICIENT_PERMISSIONS } from '@app/shared/constants/error-codes.constants';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { FilterDto } from '@app/shared/dto/filter.dto';

/**
 * Handles incoming requests related to appointments.
 * It uses the AppointmentsService to perform the actual business logic and interacts with the authentication and authorization middleware to ensure proper access control.
 */
@Controller('appointments')
@UseFilters(AllExceptionsFilter)
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
  async create(@Body() createAppointmentDto: CreateAppointmentDto): Promise<IAppointment> {
    // Calls the `create` method of the `appointmentsService` to create the appointment.
    return await this.appointmentsService.create(createAppointmentDto);
    // Returns the created appointment.
  }

  /**
   * Retrieves all appointments based on optional filters and pagination.
   * @param pagination Pagination parameters for the result set
   * @param filter Filter criteria for appointments
   * @returns A paginated list of appointments.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll(
    @Query() pagination?: PaginationDto,
    @Query() filter?: FilterDto
  ) {
    // Calls the `findAll` method of the `appointmentsService` to retrieve the appointments.
    return await this.appointmentsService.findAll(pagination, filter);
    // Returns the list of appointments.
  }

  /**
   * Retrieves a single appointment by ID.
   * @param id The ID of the appointment to retrieve.
   * @returns The requested appointment.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findOne(@Param('id') id: string): Promise<IAppointment> {
    // Calls the `findOne` method of the `appointmentsService` to retrieve the appointment.
    return await this.appointmentsService.findById(id);
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
  async update(
    @Param('id') id: string, 
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ): Promise<IAppointment> {
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
  async remove(@Param('id') id: string): Promise<void> {
    // Calls the `remove` method of the `appointmentsService` to delete the appointment.
    await this.appointmentsService.delete(id);
    // Returns no content (204 status code).
  }

  /**
   * Retrieves upcoming appointments for a user.
   * @param userId The ID of the user.
   * @param pagination Pagination parameters for the result set.
   * @returns A paginated list of upcoming appointments.
   */
  @Get('user/:userId/upcoming')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getUpcomingAppointments(
    @Param('userId') userId: string,
    @Query() pagination?: PaginationDto
  ) {
    return await this.appointmentsService.getUpcomingAppointments(userId, pagination);
  }

  /**
   * Retrieves past appointments for a user.
   * @param userId The ID of the user.
   * @param pagination Pagination parameters for the result set.
   * @returns A paginated list of past appointments.
   */
  @Get('user/:userId/past')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPastAppointments(
    @Param('userId') userId: string,
    @Query() pagination?: PaginationDto
  ) {
    return await this.appointmentsService.getPastAppointments(userId, pagination);
  }

  /**
   * Marks an appointment as completed.
   * @param id The ID of the appointment to complete.
   * @returns The updated appointment.
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async completeAppointment(@Param('id') id: string): Promise<IAppointment> {
    return await this.appointmentsService.completeAppointment(id);
  }

  /**
   * Initiates a telemedicine session for an appointment.
   * @param id The ID of the appointment.
   * @param userId The ID of the user initiating the session.
   * @returns The created telemedicine session.
   */
  @Post(':id/telemedicine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async startTelemedicineSession(
    @Param('id') id: string,
    @Body('userId') userId: string
  ) {
    return await this.appointmentsService.startTelemedicineSession(id, userId);
  }

  /**
   * Retrieves appointments for a provider.
   * @param providerId The ID of the provider.
   * @param pagination Pagination parameters for the result set.
   * @param filter Filter criteria for appointments.
   * @returns A paginated list of provider appointments.
   */
  @Get('provider/:providerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getProviderAppointments(
    @Param('providerId') providerId: string,
    @Query() pagination?: PaginationDto,
    @Query() filter?: FilterDto
  ) {
    return await this.appointmentsService.getProviderAppointments(providerId, pagination, filter);
  }

  /**
   * Retrieves today's appointments for a provider.
   * @param providerId The ID of the provider.
   * @returns A list of today's appointments.
   */
  @Get('provider/:providerId/today')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getProviderTodayAppointments(@Param('providerId') providerId: string): Promise<IAppointment[]> {
    return await this.appointmentsService.getProviderTodayAppointments(providerId);
  }

  /**
   * Confirms an appointment.
   * @param id The ID of the appointment to confirm.
   * @returns The updated appointment.
   */
  @Patch(':id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmAppointment(@Param('id') id: string): Promise<IAppointment> {
    return await this.appointmentsService.confirmAppointment(id);
  }
}