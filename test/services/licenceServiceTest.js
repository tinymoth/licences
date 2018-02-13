const createLicenceService = require('../../server/services/licenceService');
const {expect, sandbox} = require('../testSetup');

describe('licenceService', () => {

    const licenceClient = {
        getLicence: sandbox.stub().returnsPromise().resolves({licence: {a: 'b'}}),
        createLicence: sandbox.stub().returnsPromise().resolves('abc'),
        updateSection: sandbox.stub().returnsPromise().resolves(),
        updateStatus: sandbox.stub().returnsPromise().resolves(),
        getAdditionalConditions: sandbox.stub().returnsPromise().resolves([
            {USER_INPUT: {value: 1}, ID: {value: 1}, FIELD_POSITION: {value: null}}]),
        updateLicence: sandbox.stub().returnsPromise().resolves()
    };

    const establishmentsClient = {
        findById: sandbox.stub().returnsPromise().resolves({a: 'b'})
    };

    const service = createLicenceService(licenceClient, establishmentsClient);

    afterEach(() => {
        sandbox.reset();
    });

    describe('getLicence', () => {
        it('should request licence details from client', () => {
            service.getLicence('123');

            expect(licenceClient.getLicence).to.be.calledOnce();
            expect(licenceClient.getLicence).to.be.calledWith('123');
        });

        it('should return licence', () => {
            return expect(service.getLicence('123')).to.eventually.eql({licence: {a: 'b'}, status: undefined});
        });

        it('should addAdditionalConditions if they are present in licence and requested', () => {
            licenceClient.getLicence.resolves({licence: {additionalConditions: {1: {}}}});
            licenceClient.getAdditionalConditions.resolves([{
                ID: {value: 1},
                USER_INPUT: {value: null},
                TEXT: {value: 'The condition'},
                FIELD_POSITION: {value: null},
                GROUP_NAME: {value: 'group'},
                SUBGROUP_NAME: {value: 'subgroup'}}]);

            return expect(service.getLicence('123', {populateConditions: true})).to.eventually.eql({
                licence: {
                    additionalConditions: [{content: [{text: 'The condition'}],
                    group: 'group',
                    subgroup: 'subgroup'}]
                },

                status: undefined
            });
        });

        it('should not addAdditionalConditions if they are present in licence but not requested', () => {
            licenceClient.getLicence.resolves({licence: {additionalConditions: {1: {}}}});
            licenceClient.getAdditionalConditions.resolves([{
                ID: {value: 1},
                USER_INPUT: {value: null},
                TEXT: {value: 'The condition'},
                FIELD_POSITION: {value: null}}]);

            return expect(service.getLicence('123')).to.eventually.eql({
                licence: {
                    additionalConditions: {1: {}}
                }, status: undefined
            });
        });

        it('should throw if error getting licence', () => {
            licenceClient.getLicence.rejects();
            return expect(service.getLicence('123')).to.eventually.be.rejected();
        });
    });

    describe('createLicence', () => {
        it('should create a licence', () => {
            service.createLicence('123');

            expect(licenceClient.createLicence).to.be.calledOnce();
            expect(licenceClient.createLicence).to.be.calledWith('123', {});
        });

        it('should pass in a valid licence', () => {
            service.createLicence('123', {firstName: 'M', bad: '1'});

            expect(licenceClient.createLicence).to.be.calledOnce();
            expect(licenceClient.createLicence).to.be.calledWith('123', {firstName: 'M'});
        });

        it('should return returned id', () => {
            return expect(service.createLicence('123')).to.eventually.eql('abc');
        });

        it('should throw if error getting licence', () => {
            licenceClient.createLicence.rejects();
            return expect(service.createLicence('123')).to.eventually.be.rejected();
        });
    });

    describe('updateLicenceConditions', () => {

        it('should get the selected licence conditions', () => {
            service.updateLicenceConditions({nomisId: 'ab1', additionalConditions: ['Scotland Street']});

            expect(licenceClient.getAdditionalConditions).to.be.calledOnce();
            expect(licenceClient.getAdditionalConditions).to.be.calledWith(['Scotland Street']);
        });

        it('should call update section with additional conditions from the licence client', async () => {
            licenceClient.getAdditionalConditions.resolves([
                {USER_INPUT: {value: 1}, ID: {value: 1}, FIELD_POSITION: {value: null}}]);

            await service.updateLicenceConditions({nomisId: 'ab1', additionalConditions: ['Scotland Street']});

            expect(licenceClient.updateSection).to.be.calledOnce();
            expect(licenceClient.updateSection).to.be.calledWith(
                'additionalConditions',
                'ab1',
                {1: {}}
            );
        });

        it('should throw if error updating licence', () => {
            licenceClient.updateSection.rejects();
            const args = {nomisId: 'ab1', additionalConditions: ['Scotland Street']};
            return expect(service.updateLicenceConditions(args)).to.eventually.be.rejected();
        });
    });

    describe('markForHandover', () => {

        it('should call updateStatus from the licence client', () => {
            service.markForHandover('ab1', 'CA', 'RO');

            expect(licenceClient.updateStatus).to.be.calledOnce();
            expect(licenceClient.updateStatus).to.be.calledWith('ab1', 'PROCESSING_RO');
        });

        it('should pick the right status based on sender and receiver', () => {
            service.markForHandover('ab1', 'CA', 'DM');
            expect(licenceClient.updateStatus).to.be.calledWith('ab1', 'APPROVAL');

            service.markForHandover('ab1', 'DM', 'CA');
            expect(licenceClient.updateStatus).to.be.calledWith('ab1', 'DECIDED');
        });

        it('should throw if error during update status', () => {
            licenceClient.updateStatus.rejects();
            return expect(service.markForHandover('ab1', 'CA', 'RO')).to.eventually.be.rejected();
        });

        it('should throw if no matching sender-receiver pair', () => {
            expect(() => service.markForHandover('ab1', 'CA', 'UNMATCHED')).to.throw(Error);
        });
    });


    describe('update', () => {

        const nomisId = 'ab1';

        const baseLicence = {
            section1: '',
            section2: '',
            section3: {},
            section4: {
                form1: {},
                form2: {answer: 'answer'}
            }
        };

        context('When there are dependents', () => {
            const licence = {
                ...baseLicence,
                section4: {
                    ...baseLicence.section4,
                    form3: {
                        decision: '',
                        followUp1: '',
                        followUp2: ''
                    }
                }

            };

            const fieldMap = [
                {decision: {}},
                {followUp1: {
                    dependentOn: 'decision',
                    predicate: 'Yes'}
                },
                {followUp2: {
                    dependentOn: 'decision',
                    predicate: 'Yes'}
                }

            ];

            it('should store dependents if predicate matches', async () => {
                const userInput = {
                    decision: 'Yes',
                    followUp1: 'County',
                    followUp2: 'Town'
                };

                const licenceSection = 'section4';
                const formName= 'form3';

                const output = await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

                expect(output).to.eql({
                    ...licence,
                    section4: {
                        ...licence.section4,
                        form3: {
                            decision: 'Yes',
                            followUp1: 'County',
                            followUp2: 'Town'
                        }
                    }
                });
            });

            it('should remove dependents if predicate does not match', async () => {
                const userInput = {
                    decision: 'No',
                    followUp1: 'County',
                    followUp2: 'Town'
                };

                const licenceSection = 'section4';
                const formName = 'form3';

                const output = await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

                expect(output).to.eql({
                    ...licence,
                    section4: {
                        ...licence.section4,
                        form3: {
                            decision: 'No'
                        }
                    }
                });
            });
        });

        context('When there are no dependents', () => {

            const licence = {
                ...baseLicence,
                section4: {
                    ...baseLicence.section4,
                    form3: {
                        decision: '',
                        followUp1: '',
                        followUp2: ''
                    }
                }

            };

            const fieldMap = [
                {decision: {}},
                {followUp1: {}},
                {followUp2: {}}
            ];

            it('should store everything', async () => {
                const userInput = {
                    decision: 'Yes',
                    followUp1: 'County',
                    followUp2: 'Town'
                };

                const licenceSection = 'section4';
                const formName = 'form3';

                const output = await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

                expect(output).to.eql({
                    ...licence,
                    section4: {
                        ...licence.section4,
                        form3: {
                            decision: 'Yes',
                            followUp1: 'County',
                            followUp2: 'Town'
                        }
                    }
                });
            });
        });
        it('should call updateLicence and pass in the licence', async() => {

            const licence = {
                ...baseLicence,
                section4: {
                    ...baseLicence.section4,
                    form3: {
                        decision: '',
                        followUp1: '',
                        followUp2: ''
                    }
                }

            };

            const fieldMap = [
                {decision: {}},
                {followUp1: {}},
                {followUp2: {}}
            ];

            const userInput = {
                decision: 'Yes',
                followUp1: 'County',
                followUp2: 'Town'
            };

            const licenceSection = 'section4';
            const formName = 'form3';

            await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

            const expectedLicence = {
                ...licence,
                section4: {
                    ...licence.section4,
                    form3: {
                        decision: 'Yes',
                        followUp1: 'County',
                        followUp2: 'Town'
                    }
                }
            };
            expect(licenceClient.updateLicence).to.be.calledOnce();
            expect(licenceClient.updateLicence).to.be.calledWith('ab1', expectedLicence);
        });

        it('should add new form to the licence', async() => {

            const licence = {
                ...baseLicence,
                section4: {
                    ...baseLicence.section4
                }

            };

            const fieldMap = [
                {decision: {}},
                {followUp1: {}},
                {followUp2: {}}
            ];

            const userInput = {
                decision: 'Yes',
                followUp1: 'County',
                followUp2: 'Town'
            };

            const licenceSection = 'section4';
            const formName = 'form3';

            const output = await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

            const expectedLicence = {
                ...licence,
                section4: {
                    ...licence.section4,
                    form3: {
                        decision: 'Yes',
                        followUp1: 'County',
                        followUp2: 'Town'
                    }
                }
            };
            expect(output).to.eql(expectedLicence);
        });

        it('should add new section to the licence', async() => {

            const licence = {
                ...baseLicence,
                section4: {
                    ...baseLicence.section4
                }

            };

            const fieldMap = [
                {decision: {}},
                {followUp1: {}},
                {followUp2: {}}
            ];

            const userInput = {
                decision: 'Yes',
                followUp1: 'County',
                followUp2: 'Town'
            };

            const licenceSection = 'section5';
            const formName = 'form3';

            const output = await service.update({nomisId, licence, fieldMap, userInput, licenceSection, formName});

            const expectedLicence = {
                ...licence,
                section5: {
                    form3: {
                        decision: 'Yes',
                        followUp1: 'County',
                        followUp2: 'Town'
                    }
                }
            };
            expect(output).to.eql(expectedLicence);
        });
    });
});
