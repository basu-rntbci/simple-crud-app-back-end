const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  });
  const res = await request(app).post('/api/auth/login').send({
    email: 'test@example.com',
    password: 'password123',
  });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Product.deleteMany();
});

describe('GET /api/products', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(401);
  });

  it('returns an empty list when no products exist', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('POST /api/products', () => {
  it('creates a product successfully', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 9.99, quantity: 10 });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.name).toBe('Widget');
    expect(res.body.data.price).toBe(9.99);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 9.99 });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when price is negative', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: -5 });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product', async () => {
    const create = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 9.99 });
    const id = create.body.data._id;

    const res = await request(app)
      .get(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('returns 400 for an invalid ID format', async () => {
    const res = await request(app)
      .get('/api/products/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates a product', async () => {
    const create = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 9.99 });
    const id = create.body.data._id;

    const res = await request(app)
      .put(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 19.99 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.price).toBe(19.99);
  });

  it('returns 404 for a non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price: 5 });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product', async () => {
    const create = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Widget', price: 9.99 });
    const id = create.body.data._id;

    const res = await request(app)
      .delete(`/api/products/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when deleting a non-existent product', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
