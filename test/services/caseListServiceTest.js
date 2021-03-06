const createCaseListService = require('../../server/services/caseListService');
const createCaseListFormatter = require('../../server/services/utils/caseListFormatter');
const {logger} = require('../supertestSetup');

describe('caseListService', () => {
    let nomisClient;
    let service;
    let licenceClient;

    const roPrisoners = [
        {offenderNo: 'A'},
        {offenderNo: 'B'},
        {offenderNo: 'C'}
    ];
    const hdcEligiblePrisoners = [
        {
            bookingId: 0,
            offenderNo: 'A12345',
            firstName: 'MARK',
            middleNames: '',
            lastName: 'ANDREWS',
            agencyLocationDesc: 'BERWIN (HMP)',
            internalLocationDesc: 'A-C-2-002',
            sentenceDetail: {
                homeDetentionCurfewEligibilityDate: '2017-09-07',
                conditionalReleaseDate: '2017-12-15',
                effectiveConditionalReleaseDate: '2017-12-16',
                receptionDate: '2018-01-03'
            }
        }
    ];
    const user = {
        username: '123',
        token: 'token',
        role: 'CA'
    };
    const ROUser = {
        username: '123',
        token: 'token',
        role: 'RO'
    };

    beforeEach(() => {
        nomisClient = {
            getHdcEligiblePrisoners: sinon.stub(),
            getOffenderSentences: sinon.stub().resolves([
                {
                    bookingId: 0,
                    offenderNo: 'A12345',
                    firstName: 'MARK',
                    middleNames: '',
                    lastName: 'ANDREWS',
                    agencyLocationDesc: 'BERWIN (HMP)',
                    internalLocationDesc: 'A-C-2-002',
                    sentenceDetail: {
                        homeDetentionCurfewEligibilityDate: '2017-09-07',
                        effectiveConditionalReleaseDate: '2017-12-15',
                        receptionDate: '2018-01-03'
                    }
                }
            ]),
            getROPrisoners: sinon.stub()
        };

        licenceClient = {
            getLicences: sinon.stub().resolves([]),
            getDeliusUserName: sinon.stub().returns('foo-username')
        };

        const nomisClientBuilder = sinon.stub().returns(nomisClient);
        const caseListFormatter = createCaseListFormatter(logger, licenceClient);

        service = createCaseListService(nomisClientBuilder, licenceClient, caseListFormatter);
    });


    describe('getHdcCaseList', () => {
        it('should format dates', async () => {
            nomisClient.getHdcEligiblePrisoners.returns(hdcEligiblePrisoners);

            const result = await service.getHdcCaseList(user.token, user.username, user.role);

            expect(result[0].sentenceDetail.homeDetentionCurfewEligibilityDate).to.eql('07/09/2017');
            expect(result[0].sentenceDetail.effectiveConditionalReleaseDate).to.eql('16/12/2017');
        });

        it('should capitalise names', async () => {
            nomisClient.getHdcEligiblePrisoners.returns(hdcEligiblePrisoners);

            const result = await service.getHdcCaseList(user.token, user.username, user.role);

            expect(result[0].firstName).to.eql('Mark');
            expect(result[0].lastName).to.eql('Andrews');
        });

        it('should add a status to the prisoners', async () => {
            nomisClient.getHdcEligiblePrisoners.returns(hdcEligiblePrisoners);

            const result = await service.getHdcCaseList(user.token, user.username, user.role);

            expect(result[0].status).to.eql('Not started');
        });

        it('should add a processing stage to the prisoners', async () => {
            nomisClient.getHdcEligiblePrisoners.returns(hdcEligiblePrisoners);

            const result = await service.getHdcCaseList(user.token, user.username, user.role);

            expect(result[0].stage).to.eql('UNSTARTED');
        });

        it('should return empty array if no results', () => {
            nomisClient.getHdcEligiblePrisoners.resolves([]);

            return expect(service.getHdcCaseList(user.token, user.username, user.role)).to.eventually.eql([]);
        });

        it('should return empty array if no null returned', () => {
            nomisClient.getHdcEligiblePrisoners.resolves(null);

            return expect(service.getHdcCaseList(user.token, user.username, user.role)).to.eventually.eql([]);
        });

        context('when user is a CA', () => {
            it('should call getHdcEligiblePrisoners from nomisClient', () => {
                service.getHdcCaseList(user.token, user.username, user.role);

                expect(nomisClient.getHdcEligiblePrisoners).to.be.calledOnce();
                expect(nomisClient.getHdcEligiblePrisoners.firstCall.args.length).to.eql(0);
            });
        });

        context('when user is a RO', () => {
            it('should call getROPrisoners && getOffenderSentences from nomisClient', async () => {
                nomisClient.getROPrisoners.resolves(roPrisoners);

                await service.getHdcCaseList(ROUser.token, ROUser.username, ROUser.role);

                expect(nomisClient.getROPrisoners).to.be.calledOnce();
                expect(nomisClient.getOffenderSentences).to.be.calledOnce();
                expect(nomisClient.getOffenderSentences).to.be.calledWith(['A', 'B', 'C']);
            });

            it('should not call getOffenderSentences when no results from getROPrisoners', async () => {

                nomisClient.getROPrisoners.resolves([]);

                await service.getHdcCaseList(ROUser.token, ROUser.username, ROUser.role);

                expect(nomisClient.getROPrisoners).to.be.calledOnce();
                expect(nomisClient.getOffenderSentences).not.to.be.calledOnce();
            });

            it('should return empty array if no delius user name found', async () => {
                licenceClient.getDeliusUserName.resolves(undefined);

                const result = await service.getHdcCaseList(ROUser.token, ROUser.username, ROUser.role);

                expect(result).to.eql([]);
                expect(nomisClient.getROPrisoners).not.to.be.calledOnce();
                expect(nomisClient.getHdcEligiblePrisoners).not.to.be.calledOnce();
            });
        });

        describe('sorting', () => {
            const offender1 = {
                name: 'offender1',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-09-14',
                    conditionalReleaseDate: '2017-12-15',
                    releaseDate: '2017-12-15'
                }
            };
            const offender2 = {
                name: 'offender2',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-10-07',
                    conditionalReleaseDate: '2017-12-15',
                    releaseDate: '2017-12-15'
                }
            };
            const offender3 = {
                name: 'offender3',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-11-06',
                    conditionalReleaseDate: '2017-01-13',
                    releaseDate: '2017-01-13'
                }
            };

            const offender4 = {
                name: 'offender4',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-11-07',
                    conditionalReleaseDate: '2017-07-22',
                    releaseDate: '2017-07-22'
                }
            };

            const offender5 = {
                name: 'offender5',
                sentenceDetail: {
                    homeDetentionCurfewEligibilityDate: '2017-11-07',
                    conditionalReleaseDate: '2017-12-13',
                    releaseDate: '2017-12-13'
                }
            };

            it('should order by homeDetentionCurfewEligibilityDate first', async () => {
                nomisClient.getHdcEligiblePrisoners.resolves([
                    offender3,
                    offender1,
                    offender2
                ]);

                const result = await service.getHdcCaseList(user.token, user.username, user.role);

                expect(result[0].name).to.eql('offender1');
                expect(result[1].name).to.eql('offender2');
                expect(result[2].name).to.eql('offender3');
            });

            it('should order by releaseDate second', async () => {
                nomisClient.getHdcEligiblePrisoners.resolves([
                    offender5,
                    offender4,
                    offender3
                ]);

                const result = await service.getHdcCaseList(user.token, user.username, user.role);

                expect(result[0].name).to.eql('offender3');
                expect(result[1].name).to.eql('offender4');
                expect(result[2].name).to.eql('offender5');
            });
        });
    });
});
