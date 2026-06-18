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
  UseFilters,
} from '@nestjs/common';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { CreateUserUseCase } from '../application/create-user.use-case';
import type { CreateUserDto } from './dto/create-user.dto';
import { UserResponse, toUserResponse } from './dto/user-response.dto';

@Controller('users')
@UseFilters(DomainExceptionFilter)
export class UserController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponse> {
    const user = await this.createUser.execute({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      confirmPassword: dto.confirmPassword,
    });

    return toUserResponse(user);
  }
}
