import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UsersService } from './users.service.js';
import type { UsersRepository } from './users.repository.js';
import type { User } from '../generated/prisma/client.js';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'demo@example.com',
    name: 'Demo',
    passwordHash: 'hashed',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UsersService', () => {
  let repository: {
    findByEmail: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let service: UsersService;

  beforeEach(() => {
    repository = { findByEmail: vi.fn(), findById: vi.fn(), create: vi.fn() };
    service = new UsersService(repository as unknown as UsersRepository);
  });

  describe('create', () => {
    it('нормализует email и отдаёт UserResponse без passwordHash', async () => {
      repository.findByEmail.mockResolvedValue(null);
      const created = buildUser({ email: 'demo@example.com' });
      repository.create.mockResolvedValue(created);

      const result = await service.create({
        email: '  Demo@Example.com  ',
        name: 'Demo',
        passwordHash: 'hashed',
      });

      expect(repository.findByEmail).toHaveBeenCalledWith('demo@example.com');
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'demo@example.com' }),
      );
      expect(result).toEqual({
        id: created.id,
        email: created.email,
        name: created.name,
        createdAt: created.createdAt.toISOString(),
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('бросает ConflictException, если email уже занят', async () => {
      repository.findByEmail.mockResolvedValue(buildUser());

      await expect(
        service.create({ email: 'demo@example.com', name: 'Demo', passwordHash: 'hashed' }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findCredentialsByEmail', () => {
    it('возвращает user и passwordHash отдельно', async () => {
      const found = buildUser();
      repository.findByEmail.mockResolvedValue(found);

      const result = await service.findCredentialsByEmail('Demo@Example.com');

      expect(repository.findByEmail).toHaveBeenCalledWith('demo@example.com');
      expect(result?.passwordHash).toBe(found.passwordHash);
      expect(result?.user).toEqual({
        id: found.id,
        email: found.email,
        name: found.name,
        createdAt: found.createdAt.toISOString(),
      });
    });

    it('возвращает null, если пользователь не найден', async () => {
      repository.findByEmail.mockResolvedValue(null);

      await expect(service.findCredentialsByEmail('nobody@example.com')).resolves.toBeNull();
    });
  });
});
