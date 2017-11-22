const {
    request,
    sandbox,
    appSetup,
    expect
} = require('../supertestSetup');

const createAdditionalConditionsRoute = require('../../server/routes/additionalConditions');

const loggerStub = {
    debug: sandbox.stub()
};

const conditionsServiceStub = {
    getStandardConditions: sandbox.stub().returnsPromise().resolves([{TEXT: {value: 'hi'}}]),
    getAdditionalConditions: sandbox.stub().returnsPromise().resolves({
        base: {
            base: [{TEXT: {value: 'hi'}, ID: {value: 'ho'}, USER_INPUT: {}}]
        }
    })
};

const licenceServiceStub = {
    updateLicenceConditions: sandbox.stub().returnsPromise().resolves(),
    getLicence: sandbox.stub().returnsPromise().resolves(null)
};

const app = appSetup(createAdditionalConditionsRoute({
    logger: loggerStub,
    conditionsService: conditionsServiceStub,
    licenceService: licenceServiceStub
}));

describe('GET /additionalConditions/:prisonNumber', () => {

    afterEach(() => {
        sandbox.reset();
    });

    it('renders and HTML output', () => {
        return request(app)
            .get('/1')
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
                expect(conditionsServiceStub.getAdditionalConditions).to.be.calledOnce();
                expect(conditionsServiceStub.getStandardConditions).to.not.be.calledOnce();
            });
    });

    it('passes the licence into getAdditionalConditions if one exists', () => {
        licenceServiceStub.getLicence.resolves({licence: {additionalConditions: {a: '1'}}});
        return request(app)
            .get('/1')
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
                expect(conditionsServiceStub.getAdditionalConditions).to.be.calledOnce();
                expect(conditionsServiceStub.getAdditionalConditions).to.be.calledWith(
                    {additionalConditions: {a: '1'}});
            });
    });
});

describe('GET /additionalConditions/standard/:prisonNumber', () => {
    it('renders and HTML output', () => {
        return request(app)
            .get('/standard/1')
            .expect(200)
            .expect('Content-Type', /html/)
            .expect(res => {
                expect(conditionsServiceStub.getStandardConditions).to.be.calledOnce();
            });

    });
});

describe('POST /additionalConditions/:prisonNumber', () => {

    const formResponse = {
        nomisId: '123',
        additionalConditions: ['mentalHealthName'],
        mentalHealthName: 'response'
    };

    it('calls updateLicenceConditions from licenceService', () => {
        return request(app)
            .post('/1')
            .send(formResponse)
            .expect(302)
            .expect(res => {
                expect(licenceServiceStub.updateLicenceConditions).to.be.calledOnce();
                expect(licenceServiceStub.updateLicenceConditions).to.be.calledWith(formResponse);
                expect(res.header['location']).to.include('reporting');
            });

    });
});
