module.exports = {

    hdc_ap_pss: {
        EST_PREMISE: {
            paths: [['establishment', 'premise']],
            displayName: 'Prison name'
        },
        EST_PHONE: {
            paths: [['establishment', 'phones', 0, 'number']],
            displayName: 'Prison telephone number'
        },
        OFF_NAME: {
            paths: [
                ['prisonerInfo', 'firstName'],
                ['prisonerInfo', 'middleName'],
                ['prisonerInfo', 'lastName']
            ],
            separator: ' ',
            displayName: 'Offender name'
        },
        OFF_DOB: {
            paths: [['prisonerInfo', 'dateOfBirth']],
            displayName: 'Offender date of birth'
        },
        OFF_PHOTO: {
            paths: [['photo']],
            displayName: 'Offender photograph'
        },

        OFF_BOOKING: {
            paths: [['prisonerInfo', 'bookingId']],
            displayName: 'Offender booking ID'
        },
        OFF_NOMS: {
            paths: [['nomisId']],
            displayName: 'Offender Noms ID'
        },
        OFF_CRO: {
            paths: [['prisonerInfo', 'CRO']],
            displayName: 'Offender CRO'
        },
        OFF_PNC: {
            paths: [['prisonerInfo', 'PNC']],
            displayName: 'Offender PNC'
        },

        SENT_HDCAD: {
            paths: [['prisonerInfo', 'sentenceDetail', 'homeDetentionCurfewActualDate']],
            displayName: 'HDCAD'
        },
        SENT_CRD: {
            paths: [['prisonerInfo', 'sentenceDetail', 'releaseDate']],
            displayName: 'CRD'
        },
        SENT_LED: {
            paths: [['prisonerInfo', 'sentenceDetail', 'licenceExpiryDate']],
            displayName: 'LED'
        },
        SENT_SED: {
            paths: [['prisonerInfo', 'sentenceDetail', 'sentenceExpiryDate']],
            displayName: 'SED'
        },
        SENT_TUSED: {
            paths: [['prisonerInfo', 'sentenceDetail', 'topupSupervisionExpiryDate']],
            displayName: 'TUSED'
        },

        REPORTING_NAME: {
            paths: [['licence', 'reporting', 'reportingInstructions', 'name']],
            displayName: 'Reporting name'
        },
        REPORTING_ADDRESS: {
            paths: [
                ['licence', 'reporting', 'reportingInstructions', 'buildingAndStreet1'],
                ['licence', 'reporting', 'reportingInstructions', 'buildingAndStreet2'],
                ['licence', 'reporting', 'reportingInstructions', 'townOrCity'],
                ['licence', 'reporting', 'reportingInstructions', 'postcode']
            ],
            separator: '\n',
            displayName: 'Reporting address'
        },
        REPORTING_AT: {
            paths: [['licence', 'reporting', 'reportingInstructions', 'at']],
            displayName: 'Reporting at'
        },
        REPORTING_ON: {
            paths: [['licence', 'reporting', 'reportingInstructions', 'on']],
            displayName: 'Reporting on'
        },

        CURFEW_ADDRESS: {
            paths: [
                ['licence', 'proposedAddress', 'curfewAddress', 'addresses', 0, 'addressLine1'],
                ['licence', 'proposedAddress', 'curfewAddress', 'addresses', 0, 'addressLine2'],
                ['licence', 'proposedAddress', 'curfewAddress', 'addresses', 0, 'addressTown'],
                ['licence', 'proposedAddress', 'curfewAddress', 'addresses', 0, 'postCode']
            ],
            separator: '\n',
            displayName: 'Curfew address'
        },

        CURFEW_FIRST_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'firstNightFrom']],
            displayName: 'Curfew first night from'
        },
        CURFEW_FIRST_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'firstNightUntil']],
            displayName: 'Curfew first night until'
        },
        CURFEW_MON_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'mondayFrom']],
            displayName: 'Curfew Monday from'
        },
        CURFEW_MON_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'mondayUntil']],
            displayName: 'Curfew Monday until'
        },
        CURFEW_TUE_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'tuesdayFrom']],
            displayName: 'Curfew Tuesday from'
        },
        CURFEW_TUE_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'tuesdayUntil']],
            displayName: 'Curfew Tuesday until'
        },
        CURFEW_WED_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'wednesdayFrom']],
            displayName: 'Curfew Wednesday from'
        },
        CURFEW_WED_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'wednesdayUntil']],
            displayName: 'Curfew Wednesday until'
        },
        CURFEW_THU_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'thursdayFrom']],
            displayName: 'Curfew Thursday from'
        },
        CURFEW_THU_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'thursdayUntil']],
            displayName: 'Curfew Thursday until'
        },
        CURFEW_FRI_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'fridayFrom']],
            displayName: 'Curfew Friday from'
        },
        CURFEW_FRI_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'fridayUntil']],
            displayName: 'Curfew Friday until'
        },
        CURFEW_SAT_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'saturdayFrom']],
            displayName: 'Curfew Saturday from'
        },
        CURFEW_SAT_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'saturdayUntil']],
            displayName: 'Curfew Saturday until'
        },
        CURFEW_SUN_FROM: {
            paths: [['licence', 'curfew', 'curfewHours', 'sundayFrom']],
            displayName: 'Curfew Sunday from'
        },
        CURFEW_SUN_UNTIL: {
            paths: [['licence', 'curfew', 'curfewHours', 'sundayUntil']],
            displayName: 'Curfew Sunday until'
        },

        MONITOR: {
            paths: [['licence', 'monitoring', 'telephone']],
            displayName: 'Monitoring company telephone number'
        },

        CONDITIONS: {
            paths: [['conditions']],
            displayName: 'Additional conditions'
        }
    }
};