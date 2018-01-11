const createPrisonerService = require('../../server/services/prisonerService');
const {
    sandbox,
    expect
} = require('../testSetup');

describe('prisonerDetailsService', () => {

    const bookingResponse = [{
        bookingId: 1,
        facialImageId: 2,
        dateOfBirth: '1971-12-23',
        firstName: 'f',
        middleName: 'm',
        lastName: 'l',
        offenderNo: 'noms',
        aliases: 'alias',
        assignedLivingUnitDesc: 'loc'
    }];

    const bookingDetailResponse = {physicalAttributes: {gender: 'male'}};

    const imageInfoResponse = {
        imageId: 'imgId',
        captureDate: '1971-11-23'
    };

    const imageDataResponse = new Buffer('image');

    const sentenceDetailResponse = {sentenceExpiryDate: '1985-12-03'};

    const nomisClientMock = {
        getBookings: sandbox.stub().returnsPromise().resolves(bookingResponse),
        getBooking: sandbox.stub().returnsPromise().resolves(bookingDetailResponse),
        getSentenceDetail: sandbox.stub().returnsPromise().resolves(sentenceDetailResponse),
        getImageInfo: sandbox.stub().returnsPromise().resolves(imageInfoResponse),
        getImageData: sandbox.stub().returnsPromise().resolves(imageDataResponse)
    };

    const nomisClientBuilder = sandbox.stub().returns(nomisClientMock);

    const prisonerInfoResponse = {
        bookingId: 1,
        facialImageId: 2,
        dateOfBirth: '23/12/1971',
        firstName: 'F',
        middleName: 'M',
        lastName: 'L',
        offenderNo: 'noms',
        aliases: 'Alias',
        assignedLivingUnitDesc: 'Loc',
        physicalAttributes: {gender: 'Male'},
        imageId: 'imgId',
        captureDate: '23/11/1971',
        sentenceExpiryDate: '03/12/1985'
    };

    const service = createPrisonerService(nomisClientBuilder);

    afterEach(() => {
        sandbox.reset();
    });

    describe('getPrisonerDetails', () => {

        it('should call the api with the nomis id', async () => {
            await service.getPrisonerDetails('123');

            expect(nomisClientMock.getBookings).to.be.calledOnce();
            expect(nomisClientMock.getBooking).to.be.calledOnce();
            expect(nomisClientMock.getSentenceDetail).to.be.calledOnce();
            expect(nomisClientMock.getImageInfo).to.be.calledOnce();

            expect(nomisClientMock.getBookings).to.be.calledWith('123');
            expect(nomisClientMock.getBooking).to.be.calledWith(1);
            expect(nomisClientMock.getSentenceDetail).to.be.calledWith(1);
            expect(nomisClientMock.getImageInfo).to.be.calledWith(2);
        });

        it('should return the result of the api call', () => {
            return expect(service.getPrisonerDetails('123'))
                .to.eventually.eql(prisonerInfoResponse);
        });

        it('should throw if error in api', () => {
            nomisClientMock.getBookings.rejects(new Error('dead'));

            return expect(service.getPrisonerDetails('123')).to.be.rejected();
        });

        it('it should return false for imageId of no image', async () => {

            const bookingResponse2 = [{
                bookingId: 1,
                facialImageId: null,
                dateOfBirth: '1971-12-23',
                firstName: 'f',
                middleName: 'm',
                lastName: 'l',
                offenderNo: 'noms',
                aliases: 'alias',
                assignedLivingUnitDesc: 'loc'
            }];

            nomisClientMock.getBookings.resolves(bookingResponse2);

            const result = await service.getPrisonerDetails('123');
            return expect(result.imageId).to.eql(false);
        });
    });

    describe('getPrisonerImage', () => {
        it('should call getImageData with the imageId', async () => {
            await service.getPrisonerImage('123', 'token');

            expect(nomisClientMock.getImageData).to.be.calledOnce();
            expect(nomisClientMock.getImageData).to.be.calledWith('123');
        });

        it('should return a base64 encoded image', async () => {
            const base64Buffer = imageDataResponse.toString('base64');
            const expectedOutput = {image: `data:image/jpeg;base64,${base64Buffer}`};
            return expect(service.getPrisonerImage('123', 'token')).to.eventually.eql(expectedOutput);
        });

        it('should return null if no image', async () => {
            nomisClientMock.getImageData.resolves(null);
            return expect(service.getPrisonerImage('123', 'token')).to.eventually.eql({image: null});
        });

        it('should return null if no image', async () => {
            nomisClientMock.getImageData.rejects({message: 'not found'});
            return expect(service.getPrisonerImage('123', 'token')).to.eventually.eql({image: null});
        });
    });
});