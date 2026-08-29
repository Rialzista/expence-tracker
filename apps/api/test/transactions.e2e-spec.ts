import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module.js';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let token: string;
  let otherToken: string;
  let categoryId: string;
  let otherCategoryId: string;

  const email = `transactions-${Date.now()}@test.local`;
  const otherEmail = `transactions-other-${Date.now()}@test.local`;
  const password = 'supersecret';

  // Месяц берётся заведомо в прошлом и фиксированным, чтобы сводка
  // не зависела от даты прогона и от других тестов в той же базе.
  const month = 5;
  const year = 2024;
  const insideMonth = '2024-05-15T12:00:00.000Z';
  const outsideMonth = '2024-06-15T12:00:00.000Z';

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
      .send({ email, name: 'Transactions User', password });
    token = registerResponse.body.accessToken;

    const otherRegisterResponse = await request(server)
      .post('/api/auth/register')
      .send({ email: otherEmail, name: 'Other User', password });
    otherToken = otherRegisterResponse.body.accessToken;

    const categoryResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Продукты', type: 'EXPENSE' });
    categoryId = categoryResponse.body.id;

    const otherCategoryResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Чужая категория', type: 'EXPENSE' });
    otherCategoryId = otherCategoryResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/transactions без токена отвечает 401', async () => {
    await request(server).get('/api/transactions').expect(401);
  });

  it('POST /api/transactions с невалидным телом отвечает 400', async () => {
    await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '0', type: 'EXPENSE', date: insideMonth })
      .expect(400);
  });

  it('GET /api/transactions/:id с невалидным id отвечает 400', async () => {
    await request(server)
      .get('/api/transactions/not-a-uuid')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('PATCH /api/transactions/:id с пустым телом отвечает 400', async () => {
    const createResponse = await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '10.00', type: 'EXPENSE', date: insideMonth })
      .expect(201);

    await request(server)
      .patch(`/api/transactions/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it('POST /api/transactions с чужой категорией отвечает 404', async () => {
    await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '10.00', type: 'EXPENSE', date: insideMonth, categoryId: otherCategoryId })
      .expect(404);
  });

  it('полный цикл: создание → список → чтение → обновление → удаление', async () => {
    const createResponse = await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: '123.45',
        currency: 'EUR',
        type: 'EXPENSE',
        date: insideMonth,
        categoryId,
        note: 'Обед',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      amount: '123.45',
      currency: 'EUR',
      type: 'EXPENSE',
      categoryId,
      note: 'Обед',
    });
    const transactionId = createResponse.body.id;

    const listResponse = await request(server)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(listResponse.body).toMatchObject({ page: 1, limit: 20 });
    expect(listResponse.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: transactionId })]),
    );

    await request(server)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((response) => {
        expect(response.body.id).toBe(transactionId);
        expect(response.body).not.toHaveProperty('userId');
      });

    const updateResponse = await request(server)
      .patch(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Ужин', amount: '200.00' })
      .expect(200);
    expect(updateResponse.body).toMatchObject({ note: 'Ужин', amount: '200.00', currency: 'EUR' });

    await request(server)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(server)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('фильтры по типу, категории и периоду сужают выборку', async () => {
    const expenseResponse = await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '50.00', type: 'EXPENSE', date: insideMonth, categoryId })
      .expect(201);
    const incomeResponse = await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '70.00', type: 'INCOME', date: outsideMonth })
      .expect(201);

    const byType = await request(server)
      .get('/api/transactions?type=INCOME')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const byTypeIds = byType.body.items.map((item: { id: string }) => item.id);
    expect(byTypeIds).toContain(incomeResponse.body.id);
    expect(byTypeIds).not.toContain(expenseResponse.body.id);

    const byCategory = await request(server)
      .get(`/api/transactions?categoryId=${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const byCategoryIds = byCategory.body.items.map((item: { id: string }) => item.id);
    expect(byCategoryIds).toContain(expenseResponse.body.id);
    expect(byCategoryIds).not.toContain(incomeResponse.body.id);

    const byPeriod = await request(server)
      .get('/api/transactions?from=2024-05-01T00:00:00.000Z&to=2024-05-31T23:59:59.000Z')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const byPeriodIds = byPeriod.body.items.map((item: { id: string }) => item.id);
    expect(byPeriodIds).toContain(expenseResponse.body.id);
    expect(byPeriodIds).not.toContain(incomeResponse.body.id);
  });

  it('пагинация ограничивает страницу и отдаёт общее количество', async () => {
    const response = await request(server)
      .get('/api/transactions?page=1&limit=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.limit).toBe(1);
    expect(response.body.total).toBeGreaterThan(1);
  });

  it('GET /api/transactions/summary без month и year отвечает 400', async () => {
    await request(server)
      .get('/api/transactions/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /api/transactions/summary считает доход, расход и баланс за месяц', async () => {
    // Отдельный пользователь и категория: сводка считает всё за период,
    // и операции из соседних тестов исказили бы суммы.
    const summaryEmail = `transactions-summary-${Date.now()}@test.local`;
    const registerResponse = await request(server)
      .post('/api/auth/register')
      .send({ email: summaryEmail, name: 'Summary User', password })
      .expect(201);
    const summaryToken = registerResponse.body.accessToken;

    const categoryResponse = await request(server)
      .post('/api/categories')
      .set('Authorization', `Bearer ${summaryToken}`)
      .send({ name: 'Транспорт', type: 'EXPENSE' })
      .expect(201);
    const summaryCategoryId = categoryResponse.body.id;

    await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${summaryToken}`)
      .send({ amount: '1000.00', type: 'INCOME', date: insideMonth })
      .expect(201);
    await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${summaryToken}`)
      .send({
        amount: '250.50',
        type: 'EXPENSE',
        date: insideMonth,
        categoryId: summaryCategoryId,
      })
      .expect(201);
    // За пределами месяца — в сводку попасть не должна.
    await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${summaryToken}`)
      .send({ amount: '999.00', type: 'EXPENSE', date: outsideMonth })
      .expect(201);

    const summaryResponse = await request(server)
      .get(`/api/transactions/summary?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${summaryToken}`)
      .expect(200);

    expect(summaryResponse.body).toMatchObject({
      month,
      year,
      income: '1000.00',
      expense: '250.50',
      balance: '749.50',
    });
    expect(summaryResponse.body.byCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: summaryCategoryId,
          categoryName: 'Транспорт',
          type: 'EXPENSE',
          total: '250.50',
        }),
        expect.objectContaining({ categoryId: null, type: 'INCOME', total: '1000.00' }),
      ]),
    );
  });

  it('изоляция между пользователями: чужая операция не видна и не меняется', async () => {
    const createResponse = await request(server)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: '15.00', type: 'EXPENSE', date: insideMonth })
      .expect(201);
    const transactionId = createResponse.body.id;

    await request(server)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(server)
      .patch(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ note: 'Захват' })
      .expect(404);

    await request(server)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    const otherList = await request(server)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherList.body.items).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: transactionId })]),
    );

    await request(server)
      .get(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
