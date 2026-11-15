import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';

describe('CollabSpace API Tests', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  let authToken: string;
  let workspaceId: string;

  afterAll(async () => {
    // Delete the workspace first (this cascades to documents, comments, etc.)
    if (workspaceId) {
      await prisma.workspace.deleteMany({ where: { id: workspaceId } });
    }
    // Now it is safe to delete the user
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('should return 200 on health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(testEmail);
  });

  it('should fail to register a duplicate user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('should login the registered user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  it('should create a workspace', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Workspace' });
    
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Workspace');
    workspaceId = res.body.id;
  });

  it('should create a document inside the workspace', async () => {
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Test Document', workspaceId });
    
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Document');
    expect(res.body.revision).toBe(1);
  });
});