const joi = require('joi');

const optionalString = joi.string().allow('').optional();
const requiredString = joi.string().required();
const requiredYesNo = joi.valid(['Yes', 'No']).required();
const requiredIf = (field, answer) => {
    return joi.when(field, {is: answer, then: joi.string().required(), otherwise: joi.valid(['']).optional()});
};

// ELIGIBILITY
const excluded = joi.object().keys({
    decision: requiredYesNo,
    reason: requiredIf('decision', 'Yes')
});

const suitability = joi.object().keys({
    decision: requiredYesNo,
    reason: requiredIf('decision', 'Yes')
});

const crdTime = joi.object().keys({
    decision: requiredYesNo,
    reason: requiredIf('decision', 'Yes')
});

const optOut = joi.object().keys({
    decision: requiredYesNo,
    reason: requiredIf('decision', 'Yes')
});

const addressProposed = joi.object().keys({
    decision: requiredYesNo
});

const bassReferral = joi.object().keys({
    decision: requiredYesNo,
    proposedTown: requiredIf('decision', 'Yes'),
    proposedCounty: requiredIf('decision', 'Yes')
});

const curfewAddress = joi.object().keys({
    addresses: joi.array().items(joi.object().keys({
        addressLine1: requiredString,
        addressLine2: optionalString,
        addressTown: requiredString,
        postCode: requiredString,
        telephone: requiredString,
        occupier: joi.object().required().keys({
            name: requiredString,
            age: optionalString,
            relation: requiredString
        }),
        residents: joi.array().items(joi.object().keys({
            name: requiredString,
            age: optionalString,
            relation: requiredString
        })),
        cautionedAgainstResident: requiredYesNo
    }))
});

// PROCESSING_RO
const curfewAddressReview = joi.object().keys({
    consent: requiredYesNo,
    electricity: requiredIf('consent', 'Yes'),
    homeVisitConducted: requiredIf('electricity', 'Yes')
});

const addressSafety = joi.object().keys({
    deemedSafe: requiredYesNo,
    unsafeReason: requiredIf('deemedSafe', 'No')
});

const curfewHours = joi.object().keys({
    firstNightFrom: requiredString,
    firstNightUntil: requiredString,
    mondayFrom: requiredString,
    mondayUntil: requiredString,
    tuesdayFrom: requiredString,
    tuesdayUntil: requiredString,
    wednesdayFrom: requiredString,
    wednesdayUntil: requiredString,
    thursdayFrom: requiredString,
    thursdayUntil: requiredString,
    fridayFrom: requiredString,
    fridayUntil: requiredString,
    saturdayFrom: requiredString,
    saturdayUntil: requiredString,
    sundayFrom: requiredString,
    sundayUntil: requiredString
});

const riskManagement = joi.object().keys({
    planningActions: requiredYesNo,
    planningActionsDetails: requiredIf('planningActions', 'Yes'),
    awaitingInformation: requiredYesNo,
    awaitingInformationDetails: requiredIf('awaitingInformation', 'Yes'),
    victimLiaison: requiredYesNo,
    victimLiaisonDetails: requiredIf('victimLiaison', 'Yes')
});

const reportingInstructions = joi.object({
    name: requiredString,
    buildingAndStreet1: requiredString,
    buildingAndStreet2: optionalString,
    townOrCity: requiredString,
    postcode: requiredString,
    telephone: requiredString
});

const schema = {
    eligibility: {excluded, suitability, crdTime},
    proposedAddress: {optOut, addressProposed, bassReferral, curfewAddress},
    curfew: {curfewAddressReview, addressSafety, curfewHours},
    risk: {riskManagement},
    reporting: {reportingInstructions}
};

module.exports = function(licence) {
    return section => {
        if(!licence[section]) {
            return {
                details: [{path: [section], type: 'any.required', message: `${section} is required`}]
            };
        }
        return joi.validate(licence[section], schema[section], {abortEarly: false}).error;
    };
};