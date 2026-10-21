import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { HouseholdMembershipGuard } from '../../../authorization/household-membership.guard';
import { HouseholdScope } from '../../../authorization/household-scope.decorator';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { resolveToday } from '../application/client-today';
import { ListUpcomingHouseholdRemindersUseCase } from '../application/list-upcoming-household-reminders.use-case';
import {
  ReminderResponse,
  toReminderResponse,
} from './dto/reminder-response.dto';

/** Household-wide reminder views (the dashboard card), across all its pets. */
@Controller('households/:householdId/reminders')
@UseFilters(DomainExceptionFilter)
@UseGuards(HouseholdMembershipGuard)
@HouseholdScope({ type: 'householdId', location: 'param', key: 'householdId' })
export class HouseholdReminderController {
  constructor(
    private readonly listUpcoming: ListUpcomingHouseholdRemindersUseCase,
  ) {}

  /**
   * Active reminders overdue or due within `?days=` (default 30), soonest
   * first.
   */
  @Get('upcoming')
  async upcoming(
    @Param('householdId') householdId: string,
    @Query('days') days: string | undefined,
    @Query('today') today: string | undefined,
  ): Promise<ReminderResponse[]> {
    const withinDays = days === undefined ? undefined : Number(days);
    if (withinDays !== undefined && Number.isNaN(withinDays)) {
      throw new BadRequestException('« days » must be a number.');
    }
    const day = resolveToday(today);
    const reminders = await this.listUpcoming.execute({
      householdId,
      today: day,
      withinDays,
    });
    return reminders.map((reminder) => toReminderResponse(reminder, day));
  }
}
