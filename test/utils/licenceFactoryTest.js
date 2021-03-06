const {
    createAdditionalConditionsObject,
    populateAdditionalConditionsAsString,
    populateAdditionalConditionsAsObject
} = require('../../server/utils/licenceFactory');

describe('licenceFactory', () => {

    describe('createConditionsObject', () => {
        it('should return an object for each selected item', () => {

            const selectedConditions = [
                {id: 1, user_input: 'appointmentName', field_position: {appointmentName: 0}},
                {
                    id: 2, user_input: 'confinedDetails',
                    field_position: {

                        confinedTo: 0,
                        confinedFrom: 1,
                        confinedReviewFrequency: 2
                    }
                }
            ];

            const formInputs = {licenceConditions: ['appointmentName', 'confinedDetails']};

            const expectedOutput = {
                1: {appointmentName: undefined},
                2: {
                    confinedFrom: undefined,
                    confinedReviewFrequency: undefined,
                    confinedTo: undefined
                }
            };

            const output = createAdditionalConditionsObject(selectedConditions, formInputs);

            expect(output).to.eql(expectedOutput);
        });

        it('should add form data to the objects', () => {

            const selectedConditions = [
                {id: 1, user_input: 'notInSightOf', field_position: {notInSightOf: 0}},
                {
                    id: 2, user_input: 'curfewDetails',
                    field_position: {
                        curfewFrom: 0,
                        curfewTo: 1,
                        curfewTagRequired: 3,
                        curfewAddress: 2
                    }
                }
            ];

            const formInputs = {
                licenceConditions: ['notInSightOf', 'curfewDetails'],
                notInSightOf: 'abc',
                curfewFrom: '01/02/2024',
                curfewTo: '01/02/2016',
                curfewTagRequired: 'yes',
                curfewAddress: 'here',
                curfewAddressWrong: 'there'
            };

            const expectedOutput = {
                1: {notInSightOf: 'abc'},
                2: {
                    curfewFrom: '01/02/2024',
                    curfewTo: '01/02/2016',
                    curfewTagRequired: 'yes',
                    curfewAddress: 'here'
                }
            };

            const output = createAdditionalConditionsObject(selectedConditions, formInputs);

            expect(output).to.eql(expectedOutput);
        });

        it('should return empty object for conditions with no input', () => {

            const selectedConditions = [
                {id: 1, user_input: 'notInSightOf', field_position: {notInSightOf: 0}},
                {id: 2, user_input: 'null', field_position: null}
            ];

            const formInputs = {
                licenceConditions: ['1', '2'],
                notInSightOf: 'abc'
            };

            const expectedOutput = {
                1: {notInSightOf: 'abc'},
                2: {}
            };

            const output = createAdditionalConditionsObject(selectedConditions, formInputs);

            expect(output).to.eql(expectedOutput);
        });
    });

    describe('populateAdditionalConditionsAsObject', () => {
        it('should add text to licence if selected and has no user input', () => {
            const rawLicence = {licenceConditions: {additional: {1: {}}, bespoke: []}};
            const selectedConditions = [
                {
                    id: 1,
                    user_input: null,
                    text: 'The condition',
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: [{text: 'The condition'}],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: false
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should add bespoke conditions to the output in the same format, including generated IDs', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {1: {}},
                    bespoke: [{text: 'bespoke1', approved: 'Yes'}, {text: 'bespoke2', approved: 'No'}]
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: null,
                    text: 'The condition',
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: [{text: 'The condition'}],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: false
                    },
                    {
                        content: [{text: 'bespoke1'}],
                        group: 'Bespoke',
                        subgroup: null,
                        id: 'bespoke-0',
                        approved: 'Yes'
                    },
                    {
                        content: [{text: 'bespoke2'}],
                        group: 'Bespoke',
                        subgroup: null,
                        id: 'bespoke-1',
                        approved: 'No'
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should return object for view containing condition sections', () => {
            const rawLicence = {licenceConditions: {additional: {1: {appointmentName: 'injected'}}, bespoke: []}};
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentName',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentName: 0},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: [
                            {text: 'The condition '},
                            {variable: 'injected'},
                            {text: ' with input'}
                        ],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }

                ]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text for dependency appointment conditions for view', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            appointmentAddress: 'Address 1', appointmentDate: '21/01/2018', appointmentTime: '15:30'
                        }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentAddress: 0, appointmentDate: 1, appointmentTime: 2},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [{
                    content: [
                        {text: 'The condition '},
                        {variable: 'Address 1 on 21/01/2018 at 15:30'},
                        {text: ' with input'}
                    ],
                    group: 'g',
                    subgroup: 'sg',
                    id: 1,
                    inputRequired: true
                }]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text for sample appointment conditions for view', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            attendSampleDetailsName: 'name', attendSampleDetailsAddress: 'address'
                      }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'attendSampleDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {attendSampleDetailsName: 0, attendSampleDetailsAddress: 1},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [{
                    content: [
                        {text: 'The condition '},
                        {variable: 'name, address'},
                        {text: ' with input'}
                    ],
                    group: 'g',
                    subgroup: 'sg',
                    id: 1,
                    inputRequired: true
                }]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should join all fields and separators for multi field conditions when some missing', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            appointmentAddress: 'Address 1', appointmentTime: '15:30'
                        }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentAddress: 0, appointmentDate: 1, appointmentTime: 2},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [{
                    content: [
                        {text: 'The condition '},
                        {variable: 'Address 1 on  at 15:30'},
                        {text: ' with input'}
                    ],
                    group: 'g',
                    subgroup: 'sg',
                    id: 1,
                    inputRequired: true
                }]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should replace placeholder text when multiple items for view', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {1: {field: 'injected', appointmentTime: 'injected2'}},
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {field: 0, appointmentTime: 1},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [{
                    content: [
                        {text: 'The condition '},
                        {variable: 'injected'},
                        {text: ' with input '},
                        {variable: 'injected2'},
                        {text: ' and another'}
                    ],
                    group: 'g',
                    subgroup: 'sg',
                    id: 1,
                    inputRequired: true
                }]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text when multiple items in wrong order for view', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {1: {field: 'injected', appointmentTime: 'injected2'}},
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {appointmentTime: 1, field: 0},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [{
                    content: [
                        {text: 'The condition '},
                        {variable: 'injected'},
                        {text: ' with input '},
                        {variable: 'injected2'},
                        {text: ' and another'}
                    ],
                    group: 'g',
                    subgroup: 'sg',
                    id: 1,
                    inputRequired: true
                }]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text when multiple conditions for view', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {field: 'injected', appointmentTime: 'injected2'},
                        2: {groupsOrOrganisation: 'injected3'}
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {field: 0, appointmentTime: 1},
                    group_name: 'g',
                    subgroup_name: 'sg',
                    inputRequired: true
                },
                {
                    id: 2,
                    user_input: 'groupsOrOrganisations',
                    text: 'The condition [placeholder]',
                    field_position: {groupsOrOrganisation: 0},
                    group_name: 'g2',
                    subgroup_name: 'sg2',
                    inputRequired: true
                }
            ];

            const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: [
                            {text: 'The condition '},
                            {variable: 'injected'},
                            {text: ' with input '},
                            {variable: 'injected2'},
                            {text: ' and another'}
                        ],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    },
                    {
                        content: [
                            {text: 'The condition '},
                            {variable: 'injected3'}
                        ],
                        group: 'g2',
                        subgroup: 'sg2',
                        id: 2,
                        inputRequired: true
                    }]
            };

            expect(output).to.eql(expectedOutput);

        });

        context('When there are errors in user input', () => {
            it('should return object for view containing input errors', () => {
                const rawLicence = {licenceConditions: {additional: {1: {appointmentName: 'injected'}}, bespoke: []}};
                const errorLicence = {licenceConditions: {additional: {1: {appointmentName: 'ERROR'}}, bespoke: []}};
                const selectedConditions = [
                    {
                        id: 1,
                        user_input: 'appointmentName',
                        text: 'The condition [placeholder] with input',
                        field_position: {appointmentName: 0},
                        group_name: 'g',
                        subgroup_name: 'sg'
                    }
                ];


                const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions, errorLicence);

                const expectedOutput = {
                    licenceConditions: [
                        {
                            content: [
                                {text: 'The condition '},
                                {error: '[ERROR]'},
                                {text: ' with input'}
                            ],
                            group: 'g',
                            subgroup: 'sg',
                            id: 1,
                            inputRequired: true
                        }

                    ]
                };

                expect(output).to.eql(expectedOutput);

            });

            it('should replace placeholder text for dependency appointment conditions with errors', () => {
                const rawLicence = {
                    licenceConditions: {
                        additional: {
                            1: {
                                appointmentAddress: 'Address 1', appointmentDate: '21/01/2018', appointmentTime: '15:30'
                            }
                        },
                        bespoke: []
                    }
                };

                const errors = {
                    licenceConditions: {
                        additional: {1: {appointmentDate: 'Invalid date'}}
                    }
                };
                const selectedConditions = [
                    {
                        id: 1,
                        user_input: 'appointmentDetails',
                        text: 'The condition [placeholder] with input',
                        field_position: {appointmentAddress: 0, appointmentDate: 1, appointmentTime: 2},
                        group_name: 'g',
                        subgroup_name: 'sg'
                    }
                ];

                const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions, errors);

                const expectedOutput = {
                    licenceConditions: [{
                        content: [
                            {text: 'The condition '},
                            {error: 'Address 1 on [Invalid date] at 15:30'},
                            {text: ' with input'}
                        ],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }]
                };

                expect(output).to.eql(expectedOutput);

            });

            it('should replace placeholder text for sample appointment conditions with errors', () => {
                const rawLicence = {
                    licenceConditions: {
                        additional: {
                            1: {
                                attendSampleDetailsName: 'name', attendSampleDetailsAddress: 'address'
                            }
                        },
                        bespoke: []
                    }
                };

                const errors = {
                    licenceConditions: {
                        additional: {1: {attendSampleDetailsName: 'Missing'}}
                    }
                };
                const selectedConditions = [
                    {
                        id: 1,
                        user_input: 'attendSampleDetails',
                        text: 'The condition [placeholder] with input',
                        field_position: {attendSampleDetailsName: 0, attendSampleDetailsAddress: 1},
                        group_name: 'g',
                        subgroup_name: 'sg'
                    }
                ];

                const output = populateAdditionalConditionsAsObject(rawLicence, selectedConditions, errors);

                const expectedOutput = {
                    licenceConditions: [{
                        content: [
                            {text: 'The condition '},
                            {error: '[Missing], address'},
                            {text: ' with input'}
                        ],
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }]
                };

                expect(output).to.eql(expectedOutput);

            });
        });
    });

    describe('populateAdditionalConditionsAsString', () => {

        it('should replace placeholder text when asString is true', () => {
            const rawLicence = {licenceConditions: {additional: {1: {appointmentName: 'injected'}}, bespoke: []}};
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentName',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentName: 0},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition injected with input',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should replace placeholder text for dependency appointment conditions for string', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            appointmentAddress: 'Address 1', appointmentDate: '21/01/2018', appointmentTime: '15:30'
                        }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentAddress: 0, appointmentDate: 1, appointmentTime: 2},
                    group_name: 'g',
                    subgroup_name: 'sg',
                    inputRequired: true
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition Address 1 on 21/01/2018 at 15:30 with input',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should replace placeholder text for sample appointment conditions for string', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            attendSampleDetailsName: 'name', attendSampleDetailsAddress: 'address'
                        }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'attendSampleDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {attendSampleDetailsName: 0, attendSampleDetailsAddress: 1},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition name, address with input',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should join all fields and separators for multi field conditions when some missing', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {
                            appointmentAddress: 'Address 1', appointmentTime: '15:30'
                        }
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'appointmentDetails',
                    text: 'The condition [placeholder] with input',
                    field_position: {appointmentAddress: 0, appointmentDate: 1, appointmentTime: 2},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition Address 1 on  at 15:30 with input',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);
        });

        it('should replace placeholder text when multiple items when string', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {1: {field: 'injected', appointmentTime: 'injected2'}}, bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {field: 0, appointmentTime: 1},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition injected with input injected2 and another',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text when multiple items in wrong order as string', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {1: {field: 'injected', appointmentTime: 'injected2'}}, bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {appointmentTime: 1, field: 0},
                    group_name: 'g',
                    subgroup_name: 'sg'
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition injected with input injected2 and another',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);

        });

        it('should replace placeholder text when multiple conditions as string', () => {
            const rawLicence = {
                licenceConditions: {
                    additional: {
                        1: {field: 'injected', appointmentTime: 'injected2'},
                        2: {groupsOrOrganisation: 'injected3'}
                    },
                    bespoke: []
                }
            };
            const selectedConditions = [
                {
                    id: 1,
                    user_input: 'standardCondition',
                    text: 'The condition [placeholder] with input [placeholder2] and another',
                    field_position: {field: 0, appointmentTime: 1},
                    group_name: 'g',
                    subgroup_name: 'sg',
                    inputRequired: true
                },
                {
                    id: 2,
                    user_input: 'groupsOrOrganisations',
                    text: 'The condition [placeholder]',
                    field_position: {groupsOrOrganisation: 0},
                    group_name: 'g',
                    subgroup_name: 'sg',
                    inputRequired: true
                }
            ];

            const output = populateAdditionalConditionsAsString(rawLicence, selectedConditions);

            const expectedOutput = {
                licenceConditions: [
                    {
                        content: 'The condition injected with input injected2 and another',
                        group: 'g',
                        subgroup: 'sg',
                        id: 1,
                        inputRequired: true
                    },
                    {
                        content: 'The condition injected3',
                        group: 'g',
                        subgroup: 'sg',
                        id: 2,
                        inputRequired: true
                    }
                ]
            };

            expect(output).to.eql(expectedOutput);

        });
    });
});
