var request = require('supertest'),
    app = require('../../src/app');

describe('Pipelines route', function(){
    it("should return '{}' when requesting /pipelines", function(done) {
        request(app)
            .get('/pipelines')
            .expect(200)
            .expect({}, done);
    })
});