import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { SymptomCheckerService } from './symptom-checker.service';
import { CheckSymptomsDto } from './dto/check-symptoms.dto';
import { SymptomCheckerResponse } from '@austa/interfaces/care/symptom-checker';

/**
 * Controller for handling symptom check requests in the Care Now journey.
 * Provides an endpoint for users to input symptoms and receive preliminary guidance.
 * Part of the F-111 Symptom Checker feature.
 */
@Controller('symptom-checker')
export class SymptomCheckerController {
  /**
   * Initializes the SymptomCheckerController.
   * 
   * @param symptomCheckerService Service that handles symptom checking logic
   */
  constructor(private readonly symptomCheckerService: SymptomCheckerService) {}

  /**
   * Processes symptom check requests and returns preliminary guidance.
   * Implements requirement F-111-RQ-001 allowing users to input symptoms and receive guidance.
   * 
   * @param checkSymptomsDto DTO containing the symptoms to check
   * @returns Preliminary guidance based on the symptoms, including severity level and care options
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkSymptoms(@Body() checkSymptomsDto: CheckSymptomsDto): Promise<SymptomCheckerResponse> {
    return this.symptomCheckerService.checkSymptoms(checkSymptomsDto);
  }
}