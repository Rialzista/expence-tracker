import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Categories (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let token: string;
  let otherToken: string;

  const email = `categories-${Date.now()}@test.local`;
  const otherEmail = `categories-other-${Date.now()}@test.local`;
  const password = 'supersecret';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    server = app.getHttpServer();

    const registerResponse = await request(server)
      .post('/api/auth/register')
      .send({ email, name: 'Categories User', password });
    token = registerResponse.body.accessToken;

    const otherRegisterResponse = await request(server)
      .post('/api/auth/register')
      .send({ email: otherEmail, name: 'Other User', password });
    otherToken = otherRegisterResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/categories без токена отвечает 401', async () => {
    await request(server).get('/api/categories').expect(401);
  });

  it('POST /api/categories с невалидным телом отвечает 400', async () => {
    await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', type: 'EXPENSE' })
      .expect(400);
  });

  it('PATCH /api/categories/:id с невалидным id отвечает 400', async () => {
    await request(server)
      .patch('/api/categories/not-a-uuid')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Новое имя' })
      .expect(400);
  });

  it('полный цикл: создание → список → обновление → удаление', async () => {
    const createResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Продукты', type: 'EXPENSE', color: '#ff8800', icon: 'cart' })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      name: 'Продукты',
      type: 'EXPENSE',
      color: '#ff8800',
      icon: 'cart',
    });
    const categoryId = createResponse.body.id;

    const listResponse = await request(server)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: categoryId })]),
    );

    const updateResponse = await request(server)
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Еда' })
      .expect(200);
    expect(updateResponse.body.name).toBe('Еда');

    await request(server)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(server)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/categories с дублирующимся именем отвечает 409', async () => {
    await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Транспорт', type: 'EXPENSE' })
      .expect(201);

    await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Транспорт', type: 'EXPENSE' })
      .expect(409);
  });

  it('PATCH /api/categories/:id с пустым телом отвечает 400', async () => {
    const createResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Развлечения', type: 'EXPENSE' })
      .expect(201);

    await request(server)
      .patch(`/api/categories/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('изоляция между пользователями: чужая категория не видна и не удаляется', async () => {
    const createResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Личное', type: 'EXPENSE' })
      .expect(201);
    const categoryId = createResponse.body.id;

    const otherListResponse = await request(server)
      .get('/api/categories')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherListResponse.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: categoryId })]),
    );

    await request(server)
      .patch(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Захват' })
      .expect(404);

    await request(server)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(server)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: categoryId })]),
        );
      });
  });
});
