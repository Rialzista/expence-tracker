import { ConflictException } from '@nestjs/common';
import type { EventBus } from '@nestjs/cqrs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserResponse } from '@expense-tracker/shared';

import { CreateUserHandler } from './create-user.handler.js';
import { CreateUserCommand } from './create-user.command.js';
import { UserRegisteredEvent } from '../events/user-registered.event.js';
import type { UsersService } from '../users.service.js';

const user: UserResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@example.com',
  name: 'Demo',
  createdAt: new Date().toISOString(),
};

describe('CreateUserHandler', () => {
  let usersService: { create: ReturnType<typeof vi.fn> };
  let eventBus: { publish: ReturnType<typeof vi.fn> };
  let handler: CreateUserHandler;

  beforeEach(() => {
    usersService = { create: vi.fn() };
    eventBus = { publish: vi.fn() };
    handler = new CreateUserHandler(
      usersService as unknown as UsersService,
      eventBus as unknown as EventBus,
    );
  });

  it('создаёт пользователя и публикует UserRegisteredEvent', async () => {
    usersService.create.mockResolvedValue(user);

    const result = await handler.execute(
      new CreateUserCommand(user.email, user.name, 'hashed-password'),
    );

    expect(result).toEqual(user);
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const event = eventBus.publish.mock.calls[0][0] as UserRegisteredEvent;
    expect(event).toBeInstanceOf(UserRegisteredEvent);
    expect(event.userId).toBe(user.id);
    expect(event.email).toBe(user.email);
  });

  it('не публикует событие, если UsersService бросает ConflictException', async () => {
    usersService.create.mockRejectedValue(new ConflictException('уже существует'));

    await expect(
      handler.execute(new CreateUserCommand(user.email, user.name, 'hashed-password')),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
