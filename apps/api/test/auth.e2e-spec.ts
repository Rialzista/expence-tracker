import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `auth-${Date.now()}@test.local`;
  const password = 'supersecret';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register создаёт пользователя и отдаёт токен', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name: 'Test User', password })
      .expect(201);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(email);
    expect(response.body.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/auth/register с занятым email отвечает 409', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name: 'Test User', password })
      .expect(409);
  });

  it('POST /api/auth/login с верными данными отвечает 200 и токеном', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(email);
  });

  it('POST /api/auth/login с неверным паролем отвечает 401', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('GET /api/auth/me без токена отвечает 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me с токеном отвечает 200 и тем же пользователем', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body.id).toBe(loginResponse.body.user.id);
    expect(meResponse.body.email).toBe(email);
  });

  it('GET /api/categories без токена отвечает 401', async () => {
    await request(app.getHttpServer()).get('/api/categories').expect(401);
  });
});
