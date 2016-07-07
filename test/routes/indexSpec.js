var request = require('supertest'),
    app = require('../../src/app'),
    nock = require('nock');

describe('Index route', function(){
    it('should return successfully when requesting index', function(done) {
        nock('http://nebmgttgo01.ath.cdi.bskyb.com')
            .get('/go/api/config/pipeline_groups')
            .reply(200, []);
        
        request(app)
            .get('/')
            .expect(200, done);
    })
});