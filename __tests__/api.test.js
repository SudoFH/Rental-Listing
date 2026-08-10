const { createApp, UNITS } = require('../server');

let server;
let baseUrl;

beforeEach((done) => {
  server = createApp(':memory:');
  server.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

afterEach((done) => {
  server.close(done);
});

describe('GET /api/units', () => {
  test('returns all three units', async () => {
    const res = await fetch(`${baseUrl}/api/units`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data.map((u) => u.name)).toEqual(UNITS.map((u) => u.name));
  });
});

describe('GET /api/inquiries', () => {
  test('returns an empty array when no inquiries exist', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });

  test('returns inquiries newest first', async () => {
    await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 1, name: 'Alice', email: 'alice@example.com' }),
    });
    await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 2, name: 'Bob', email: 'bob@example.com' }),
    });

    const res = await fetch(`${baseUrl}/api/inquiries`);
    const data = await res.json();

    expect(data).toHaveLength(2);
    expect(data[0].name).toBe('Bob');
    expect(data[1].name).toBe('Alice');
  });
});

describe('POST /api/inquiries', () => {
  test('creates an inquiry and returns 201 with the stored record', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: 3,
        name: 'Faith',
        email: 'faith@example.com',
        message: 'Is this unit still available?',
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toMatchObject({
      unit_id: 3,
      name: 'Faith',
      email: 'faith@example.com',
      message: 'Is this unit still available?',
    });
    expect(data.id).toBeGreaterThan(0);
    expect(new Date(data.created_at).toString()).not.toBe('Invalid Date');
  });

  test('allows an inquiry with no message', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 1, name: 'No Message', email: 'nomsg@example.com' }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toBe('');
  });

  test('rejects an unknown unitId with 400', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 999, name: 'X', email: 'x@example.com' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/unitId/);
  });

  test.each([
    [{ unitId: 1, name: '', email: 'x@example.com' }],
    [{ unitId: 1, name: 'X', email: '' }],
    [{ unitId: 1 }],
  ])('rejects invalid payload %p with 400', async (payload) => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  test('rejects a malformed email address with 400', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: 1, name: 'X', email: 'not-an-email' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/email/);
  });

  test('rejects malformed JSON with 400', async () => {
    const res = await fetch(`${baseUrl}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    });

    expect(res.status).toBe(400);
  });
});
