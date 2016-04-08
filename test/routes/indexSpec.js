var request = require('supertest'),
    app = require('../../src/app');

describe('Index route', function(){
    it('should return successfully when requesting index', function(done) {
        request(app)
            .get('/')
            .expect(200, done);
    })
});