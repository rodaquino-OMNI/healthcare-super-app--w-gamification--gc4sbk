import { Controller, Post, Get, Body, Param, Query, UseFilters, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from '@app/health/devices/devices.service';
import { ConnectDeviceDto } from '@app/health/devices/dto/connect-device.dto';
import { FilterDto } from '@austa/interfaces/common/dto';
import { IDeviceConnection } from '@austa/interfaces/journey/health/device-connection.interface';
import { BaseErrorFilter, TechnicalErrorFilter, ExternalErrorFilter } from '@austa/errors/nest';

/**
 * Handles incoming HTTP requests related to device connections,
 * providing endpoints for connecting new devices and retrieving
 * existing device connections for a user.
 */
@ApiTags('devices')
@Controller('records/:recordId/devices')
@UseFilters(BaseErrorFilter, TechnicalErrorFilter, ExternalErrorFilter)
export class DevicesController {
  /**
   * Initializes the DevicesController.
   * 
   * @param devicesService - Service that handles the business logic for device connections
   */
  constructor(private readonly devicesService: DevicesService) {}

  /**
   * Connects a new wearable device to a user's health profile.
   * Addresses F-101-RQ-004: Wearable Device Integration
   * 
   * @param recordId - ID of the health record to connect the device to
   * @param connectDeviceDto - Data for connecting the device
   * @returns The newly created DeviceConnection entity.
   */
  @Post()
  @ApiOperation({
    summary: 'Connect a wearable device',
    description: 'Connects a new wearable device to a user\'s health profile for data synchronization'
  })
  @ApiParam({
    name: 'recordId',
    description: 'The ID of the health record to connect the device to',
    type: String,
    required: true
  })
  @ApiBody({
    type: ConnectDeviceDto,
    description: 'Data required to connect a wearable device'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Device successfully connected',
    type: Object
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid device information provided'
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Health record not found'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error or device connection failure'
  })
  async connectDevice(
    @Param('recordId') recordId: string,
    @Body() connectDeviceDto: ConnectDeviceDto
  ): Promise<IDeviceConnection> {
    return this.devicesService.connectDevice(recordId, connectDeviceDto);
  }

  /**
   * Retrieves all connected devices for a given user record.
   * Part of F-101-RQ-004: Wearable Device Integration
   * 
   * @param recordId - ID of the health record to get devices for
   * @param filterDto - Optional filtering criteria
   * @returns A promise that resolves to an array of DeviceConnection entities.
   */
  @Get()
  @ApiOperation({
    summary: 'Get connected devices',
    description: 'Retrieves all wearable devices connected to a user\'s health profile'
  })
  @ApiParam({
    name: 'recordId',
    description: 'The ID of the health record to get devices for',
    type: String,
    required: true
  })
  @ApiQuery({
    name: 'filter',
    description: 'Optional filtering criteria for the devices',
    type: FilterDto,
    required: false
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of connected devices',
    type: [Object]
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Health record not found'
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error'
  })
  async getDevices(
    @Param('recordId') recordId: string,
    @Query() filterDto: FilterDto
  ): Promise<IDeviceConnection[]> {
    return this.devicesService.getDevices(recordId, filterDto);
  }
}