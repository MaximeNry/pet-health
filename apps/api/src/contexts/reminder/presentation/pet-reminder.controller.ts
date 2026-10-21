import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../auth/auth.constants';
import { HouseholdMembershipGuard } from '../../../authorization/household-membership.guard';
import { HouseholdScope } from '../../../authorization/household-scope.decorator';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { ArchiveReminderUseCase } from '../application/archive-reminder.use-case';
import { resolveToday } from '../application/client-today';
import { CompleteReminderUseCase } from '../application/complete-reminder.use-case';
import { CreateReminderUseCase } from '../application/create-reminder.use-case';
import { DeleteReminderUseCase } from '../application/delete-reminder.use-case';
import { GetPetReminderUseCase } from '../application/get-pet-reminder.use-case';
import { ListPetRemindersUseCase } from '../application/list-pet-reminders.use-case';
import { UpdateReminderUseCase } from '../application/update-reminder.use-case';
import type {
  CompleteReminderDto,
  CreateReminderDto,
  UpdateReminderDto,
} from './dto/reminder.dto';
import {
  ReminderResponse,
  toReminderResponse,
} from './dto/reminder-response.dto';

/**
 * Reminders REST API, scoped under a pet. Thin HTTP ↔ use cases layer. Every
 * route accepts an optional `?today=YYYY-MM-DD` (the caller's local day) used
 * to derive urgency and to validate completion days.
 */
@Controller('pets/:petId/reminders')
@UseFilters(DomainExceptionFilter)
// Only members of the pet's household may read or manage its reminders.
@UseGuards(HouseholdMembershipGuard)
@HouseholdScope({ type: 'pet', location: 'param', key: 'petId' })
export class PetReminderController {
  constructor(
    private readonly createReminder: CreateReminderUseCase,
    private readonly listPetReminders: ListPetRemindersUseCase,
    private readonly getPetReminder: GetPetReminderUseCase,
    private readonly updateReminder: UpdateReminderUseCase,
    private readonly completeReminder: CompleteReminderUseCase,
    private readonly archiveReminder: ArchiveReminderUseCase,
    private readonly deleteReminder: DeleteReminderUseCase,
  ) {}

  @Post()
  async create(
    @Param('petId') petId: string,
    @Body() dto: CreateReminderDto,
    @Query('today') today: string | undefined,
    @Req() req: Request,
  ): Promise<ReminderResponse> {
    const user = req.user as AuthenticatedUser;
    const reminder = await this.createReminder.execute({
      petId,
      userId: user.userId,
      title: requireString(dto.title, 'title'),
      category: requireString(dto.category, 'category'),
      dueDate: requireString(dto.dueDate, 'dueDate'),
      recurrence: dto.recurrence,
    });
    return toReminderResponse(reminder, resolveToday(today));
  }

  @Get()
  async list(
    @Param('petId') petId: string,
    @Query('today') today: string | undefined,
  ): Promise<ReminderResponse[]> {
    const day = resolveToday(today);
    const reminders = await this.listPetReminders.execute(petId);
    return reminders.map((reminder) => toReminderResponse(reminder, day));
  }

  @Get(':reminderId')
  async get(
    @Param('petId') petId: string,
    @Param('reminderId') reminderId: string,
    @Query('today') today: string | undefined,
  ): Promise<ReminderResponse> {
    const reminder = await this.getPetReminder.execute(petId, reminderId);
    return toReminderResponse(reminder, resolveToday(today));
  }

  @Patch(':reminderId')
  async update(
    @Param('petId') petId: string,
    @Param('reminderId') reminderId: string,
    @Body() dto: UpdateReminderDto,
    @Query('today') today: string | undefined,
  ): Promise<ReminderResponse> {
    const reminder = await this.updateReminder.execute({
      petId,
      reminderId,
      title: optionalString(dto.title, 'title'),
      category: optionalString(dto.category, 'category'),
      recurrence: dto.recurrence,
      dueDate: optionalString(dto.dueDate, 'dueDate'),
    });
    return toReminderResponse(reminder, resolveToday(today));
  }

  /** Marks the care as done (defaults to today). */
  @Post(':reminderId/complete')
  async complete(
    @Param('petId') petId: string,
    @Param('reminderId') reminderId: string,
    @Body() dto: CompleteReminderDto,
    @Query('today') today: string | undefined,
    @Req() req: Request,
  ): Promise<ReminderResponse> {
    const user = req.user as AuthenticatedUser;
    const day = resolveToday(today);
    const reminder = await this.completeReminder.execute({
      petId,
      reminderId,
      userId: user.userId,
      doneOn: optionalString(dto?.doneOn, 'doneOn'),
      healthDocumentId:
        dto?.healthDocumentId === null
          ? null
          : optionalString(dto?.healthDocumentId, 'healthDocumentId'),
      today: day,
    });
    return toReminderResponse(reminder, day);
  }

  @Post(':reminderId/archive')
  async archive(
    @Param('petId') petId: string,
    @Param('reminderId') reminderId: string,
    @Query('today') today: string | undefined,
  ): Promise<ReminderResponse> {
    const reminder = await this.archiveReminder.execute(petId, reminderId);
    return toReminderResponse(reminder, resolveToday(today));
  }

  @Delete(':reminderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('petId') petId: string,
    @Param('reminderId') reminderId: string,
  ): Promise<void> {
    await this.deleteReminder.execute(petId, reminderId);
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`The « ${field} » field is required.`);
  }
  return value;
}

/** `undefined` passes through (PATCH semantics: field left untouched). */
function optionalString(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : requireString(value, field);
}
