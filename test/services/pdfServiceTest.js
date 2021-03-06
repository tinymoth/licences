const nock = require('nock');

const createPdfService = require('../../server/services/pdfService');
const config = require('../../server/config');

describe('pdfService', () => {
    let licenceService;
    let conditionsService;
    let prisonerService;
    let pdfFormatter;
    let service;
    let fakePdfGenerator;

    const licence = {key: 'value'};
    const licenceResponse = {licence};
    const prisonerResponse = {facialImageId: 'imageId'};
    const establishmentResponse = {};
    const imageResponse = {};
    const values = {
        OFF_NAME: 'FIRST LAST'
    };
    const pdf1AsBytes = [80, 68, 70, 45, 49];
    const templateName = 'hdc_ap_pss';
    const logger = {
        info: sinon.stub(),
        error: sinon.stub()
    };

    beforeEach(() => {
        licenceService = {
            getLicence: sinon.stub().resolves(licenceResponse),
            updateVersion: sinon.stub().resolves(licenceResponse)
        };

        conditionsService = {
            populateLicenceWithConditions: sinon.stub().resolves(licence)
        };

        prisonerService = {
            getPrisonerDetails: sinon.stub().resolves(prisonerResponse),
            getEstablishmentForPrisoner: sinon.stub().resolves(establishmentResponse),
            getPrisonerImage: sinon.stub().resolves(imageResponse)
        };

        pdfFormatter = {
            formatPdfData: sinon.stub().resolves({values})
        };

        service = createPdfService(logger, licenceService, conditionsService, prisonerService, pdfFormatter);
        fakePdfGenerator = nock(`${config.pdf.pdfServiceHost}`);
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('generatePdf', () => {
        it('should call services, format data, and return as buffer', async () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(200, pdf1AsBytes);

            const result = await service.generatePdf(templateName, '123', {licence: {key: 'value'}}, 'username');

            expect(conditionsService.populateLicenceWithConditions).to.be.calledOnce();
            expect(prisonerService.getPrisonerDetails).to.be.calledOnce();
            expect(prisonerService.getEstablishmentForPrisoner).to.be.calledOnce();
            expect(prisonerService.getPrisonerImage).to.be.calledOnce();
            expect(pdfFormatter.formatPdfData).to.be.calledOnce();

            expect(result).to.eql(new Buffer(pdf1AsBytes));
        });

        it('should increment the version if first version', async () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(200, pdf1AsBytes);

            const rawLicence = {licence: {key: 'value'}};
            await service.generatePdf(templateName, '123', rawLicence, 'username');

            expect(licenceService.updateVersion).to.be.calledOnce();
            expect(licenceService.updateVersion).to.be.calledWith('123');
            expect(licenceService.getLicence).to.be.calledOnce();
        });

        it('should increment the version if approved version is lower than current version', async () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(200, pdf1AsBytes);

            const rawLicence = {licence: {key: 'value'}, version: 4, approvedVersion: {version: 3}};
            await service.generatePdf(templateName, '123', rawLicence, 'username');

            expect(licenceService.updateVersion).to.be.calledOnce();
            expect(licenceService.updateVersion).to.be.calledWith('123');
            expect(licenceService.getLicence).to.be.calledOnce();
        });

        it('should not increment the version if approved version is lower than current version', async () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(200, pdf1AsBytes);

            const rawLicence = {licence: {key: 'value'}, version: 4, approvedVersion: {version: 4}};
            await service.generatePdf(templateName, '123', rawLicence, 'username');

            expect(licenceService.updateVersion).to.not.be.called();
        });
    });

    describe('getPdf', () => {
        it('Posts to PDF generator and renders response as byte buffer', async () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(200, pdf1AsBytes);

            const result = await service.getPdf(templateName, values);
            expect(result).to.eql(new Buffer(pdf1AsBytes));
        });

        it('should throw if error in PDF generator service', () => {
            fakePdfGenerator
                .post('/generate', {templateName, values})
                .reply(500, 'DIED');

            return expect(service.getPdf(templateName, values)).to.be.rejected();
        });
    });

    describe('getPdfLicenceData', () => {
        it('should request details from services and pass to formatter', async () => {
            await service.getPdfLicenceData(templateName, '123', {licence: {key: 'value'}}, 'token');

            expect(conditionsService.populateLicenceWithConditions).to.be.calledOnce();
            expect(conditionsService.populateLicenceWithConditions).to.be.calledWith(licence);

            expect(prisonerService.getPrisonerDetails).to.be.calledOnce();
            expect(prisonerService.getPrisonerDetails).to.be.calledWith('123');

            expect(prisonerService.getEstablishmentForPrisoner).to.be.calledOnce();
            expect(prisonerService.getEstablishmentForPrisoner).to.be.calledWith('123');

            expect(prisonerService.getPrisonerImage).to.be.calledOnce();
            expect(prisonerService.getPrisonerImage).to.be.calledWith('imageId');

            expect(pdfFormatter.formatPdfData).to.be.calledOnce();
            expect(pdfFormatter.formatPdfData).to.be.calledWith(
                templateName, '123',
                {licence, prisonerInfo: prisonerResponse, establishment: establishmentResponse}, imageResponse);
        });

        it('should throw if error in other service', () => {
            prisonerService.getPrisonerDetails.rejects(new Error('dead'));
            return expect(service.getPdfLicenceData(
                templateName, '123', {licence: {key: 'value'}}, 'token')).to.be.rejected();
        });
    });
});
