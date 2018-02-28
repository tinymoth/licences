const {
    request,
    sandbox,
    expect,
    licenceServiceStub,
    hdcRoute,
    appSetup,
    testFormPageGets
} = require('../supertestSetup');

const {roles} = require('../../server/models/roles');

const testUser = {
    staffId: 'my-staff-id',
    token: 'my-token',
    roleCode: roles.CA
};

const app = appSetup(hdcRoute, testUser);

const form1Response = {
    decision: 'Yes',
    reasons: ['sexOffenderRegister', 'convictedSexOffences']
};

describe('/hdc/eligibility', () => {

    afterEach(() => {
        sandbox.reset();
    });

    describe('eligibility routes', () => {
        const routes = [
            {url: '/eligibility/excluded/1', content: 'statutorily excluded'},
            {url: '/eligibility/suitability/1', content: 'presumed unsuitable'},
            {url: '/eligibility/crdTime/1', content: '4 weeks until'}

        ];

        testFormPageGets(app, routes);
    });

    describe('GET /eligibility/excluded/:nomisId', () => {

        it('does not pre-populates input if it does not exist on licence', () => {
            return request(app)
                .get('/eligibility/excluded/1')
                .expect(200)
                .expect('Content-Type', /html/)
                .expect(res => {
                    expect(res.text).to.contain('<input id="excludedYes" type="radio" name="decision" value="Yes">');
                    expect(res.text).to.not.contain(
                        '<input id="excludedYes" type="radio" checked name="decision" value="Yes">');
                });
        });

        it('pre-populates input if it exists on licence', () => {
            licenceServiceStub.getLicence.resolves({
                licence: {
                    eligibility: {
                        excluded: {
                            decision: 'Yes',
                            reason: ['sexOffenderRegister', 'convictedSexOffences']
                        }
                    }
                }
            });

            return request(app)
                .get('/eligibility/excluded/1')
                .expect(200)
                .expect('Content-Type', /html/)
                .expect(res => {
                    expect(res.text).to.contain('value="sexOffenderRegister" checked');
                    expect(res.text).to.contain('value="convictedSexOffences" checked');
                });
        });
    });

    describe('POST /eligibility/excluded/:nomisId', () => {

        it('calls getLicence from licenceService', () => {
            return request(app)
                .post('/eligibility/excluded/1')
                .send(form1Response)
                .expect(302)
                .expect(res => {
                    expect(licenceServiceStub.getLicence.callCount).to.equal(1);
                });
        });


        it('calls update from licenceService and redirects to suitability page', () => {
            return request(app)
                .post('/eligibility/excluded/1')
                .send(form1Response)
                .expect(302)
                .expect(res => {
                    expect(licenceServiceStub.update).to.be.calledOnce();
                    expect(licenceServiceStub.update.args[0][0].userInput).to.eql(form1Response);
                    expect(res.header['location']).to.include('/hdc/eligibility/suitability/1');
                });

        });
    });
});

