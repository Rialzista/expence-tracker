import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserResponse } from '@expense-tracker/shared';

import { AuthService } from './auth.service.js';
import { CreateUserCommand } from '../users/commands/index.js';

const user: UserResponse = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@example.com',
  name: 'Demo',
  createdAt: new Date().toISOString(),
};

describe('AuthService', () => {
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let queryBus: { execute: ReturnType<typeof vi.fn> };
  let jwt: { signAsync: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    commandBus = { execute: vi.fn() };
    queryBus = { execute: vi.fn() };
    jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };

    service = new AuthService(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
      jwt as unknown as JwtService,
    );
  });

  describe('register', () => {
    it('отправляет CreateUserCommand с захешированным паролем', async () => {
      commandBus.execute.mockResolvedValue(user);

      await service.register({ email: user.email, name: user.name, password: 'plain-password' });

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const command = commandBus.execute.mock.calls[0][0] as CreateUserCommand;
      expect(command).toBeInstanceOf(CreateUserCommand);
      await expect(argon2.verify(command.passwordHash, 'plain-password')).resolves.toBe(true);
    });

    it('возвращает accessToken и user без passwordHash', async () => {
      commandBus.execute.mockResolvedValue(user);

      const result = await service.register({
        email: user.email,
        name: user.name,
        password: 'plain-password',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toEqual(user);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('пробрасывает ConflictException из шины', async () => {
      commandBus.execute.mockRejectedValue(new ConflictException('уже существует'));

      await expect(
        service.register({ email: user.email, name: user.name, password: 'plain-password' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('возвращает токен при верном пароле', async () => {
      const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
      queryBus.execute.mockResolvedValue({ user, passwordHash });

      const result = await service.login({ email: user.email, password: 'correct-password' });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toEqual(user);
    });

    it('бросает UnauthorizedException при неверном пароле', async () => {
      const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
      queryBus.execute.mockResolvedValue({ user, passwordHash });

      await expect(
        service.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('бросает тот же UnauthorizedException, если пользователь не найден', async () => {
      queryBus.execute.mockResolvedValueOnce(null);

      const notFoundError = await service
        .login({ email: 'nobody@example.com', password: 'whatever' })
        .catch((error: unknown) => error);

      const passwordHash = await argon2.hash('correct-password', { type: argon2.argon2id });
      queryBus.execute.mockResolvedValueOnce({ user, passwordHash });

      const wrongPasswordError = await service
        .login({ email: user.email, password: 'wrong' })
        .catch((error: unknown) => error);

      expect(notFoundError).toBeInstanceOf(UnauthorizedException);
      expect((notFoundError as UnauthorizedException).message).toBe('Неверный email или пароль');
      expect((wrongPasswordError as UnauthorizedException).message).toBe(
        'Неверный email или пароль',
      );
    });
  });
});
