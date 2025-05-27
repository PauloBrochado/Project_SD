const request = require('supertest');
const app = 'http://localhost:4000';

describe('beeDB API', () => {
  it('PUT, GET, DELETE ciclo básico', async () => {
    // PUT
    let res = await request(app)
      .put('/api/testkey?id=dn0_3000')
      .send({ value: 'abc' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    // GET
    res = await request(app)
      .get('/api/testkey?id=dn0_3000');
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('abc');
    // DELETE
    res = await request(app)
      .delete('/api/testkey?id=dn0_3000');
    expect(res.status).toBe(200);
    // GET not found
    res = await request(app)
      .get('/api/testkey?id=dn0_3000');
    expect(res.status).toBe(404);
  });
}); 