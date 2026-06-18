import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { DomainExceptionFilter } from '../../../shared/presentation/domain-exception.filter';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { DeleteUserUseCase } from '../application/delete-user.use-case';
import { GetUserUseCase } from '../application/get-user.use-case';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { UserResponse, toUserResponse } from './dto/user-response.dto';

/**
 * Users REST API. Thin HTTP ↔ use cases translation layer: input parsing and
 * projection of entities into `UserResponse` (which never exposes the password
 * hash). All business logic stays in the domain; domain errors are mapped by
 * the filter.
 */
@Controller('users')
@UseFilters(DomainExceptionFilter)
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listUsers: ListUsersUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

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

  @Get()
  async list(): Promise<UserResponse[]> {
    const users = await this.listUsers.execute();
    return users.map(toUserResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    const user = await this.getUser.execute(id);
    return toUserResponse(user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponse> {
    const user = await this.updateUser.execute({
      id,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
    });
    return toUserResponse(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteUser.execute(id);
  }
}
