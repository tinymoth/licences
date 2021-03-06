const {conditionsOrder} = require('../models/conditions');
const {multiFields} = require('../models/conditions');
const {getIn, interleave} = require('../utils/functionalHelpers');

module.exports = {
    createAdditionalConditionsObject,
    populateAdditionalConditionsAsObject,
    populateAdditionalConditionsAsString
};

function createAdditionalConditionsObject(selectedConditions, formInputs) {
    return selectedConditions.reduce((conditions, condition) => {
        const conditionAttributes = condition.field_position;
        const userInputs = conditionAttributes ? inputsFor(conditionAttributes, formInputs) : {};

        return {
            ...conditions,
            [condition.id]: {
                ...userInputs
            }
        };
    }, {});
}

// For html page
function populateAdditionalConditionsAsObject(rawLicence, selectedConditionsConfig, inputErrors = {}) {
    return addAdditionalConditions(rawLicence, selectedConditionsConfig, injectUserInputAsObject, inputErrors);
}

function addAdditionalConditions(rawLicence, selectedConditionsConfig, injectUserInputMethod, inputErrors) {

    const {additional, bespoke} = rawLicence.licenceConditions;

    const getObjectForAdditional = createAdditionalMethod(
        rawLicence, selectedConditionsConfig, injectUserInputMethod, inputErrors
    );

    const populatedAdditional = Object.keys(additional)
        .sort(orderForView)
        .map(getObjectForAdditional);

    const populatedBespoke = bespoke ? bespoke.map(getObjectForBespoke) : [];

    return {...rawLicence, licenceConditions: [...populatedAdditional, ...populatedBespoke]};
}

function createAdditionalMethod(rawLicence, selectedConditions, injectUserInputMethod, inputErrors) {
    return condition => {
        const selectedCondition = selectedConditions.find(selected => selected.id == condition);
        const userInput = getIn(rawLicence, ['licenceConditions', 'additional', condition]);
        const userErrors = getIn(inputErrors, ['licenceConditions', 'additional', condition]);
        const content = getContentForCondition(selectedCondition, userInput, injectUserInputMethod, userErrors);

        return {
            content,
            group: selectedCondition.group_name,
            subgroup: selectedCondition.subgroup_name,
            id: selectedCondition.id,
            inputRequired: !!(selectedCondition.user_input)
        };
    };
}

function getContentForCondition(selectedCondition, userInput, injectUserInputMethod, userErrors) {
    const userInputName = selectedCondition.user_input;

    return userInputName ?
        injectUserInputMethod(selectedCondition, userInput, userErrors) :
        [{text: selectedCondition.text}];
}

function getObjectForBespoke(condition, index) {
    return {
        content: [{text: condition.text}],
        group: 'Bespoke',
        subgroup: null,
        id: `bespoke-${index}`,
        approved: condition.approved
    };
}

function injectUserInputAsObject(condition, userInput, userErrors) {

    const conditionName = condition.user_input;
    const conditionText = condition.text;
    const fieldPositionObject = condition.field_position;

    if (multiFields[conditionName]) {
        return injectMultiFieldsAsObject(userInput, conditionText, userErrors, multiFields[conditionName]);
    }

    return injectUserInputStandardAsObject(userInput, conditionText, fieldPositionObject, userErrors);
}

function injectUserInputStandardAsObject(userInput, conditionText, fieldPositionObject, userErrors) {
    const fieldNames = Object.keys(fieldPositionObject);
    const splitConditionText = conditionText.split(betweenBrackets).filter(text => text);
    const reducer = injectVariablesIntoViewObject(fieldNames, fieldPositionObject, userInput, userErrors);
    return splitConditionText.reduce(reducer, []);
}

function injectVariablesIntoViewObject(fieldNames, fieldPositionObject, userInput, userErrors) {
    return (conditionArray, textSegment, index) => {
        const fieldNameForPlaceholder = fieldNames.find(field => fieldPositionObject[field] == index);
        if (!fieldNameForPlaceholder) {
            return [...conditionArray, {text: textSegment}];
        }

        const inputError = getIn(userErrors, [fieldNameForPlaceholder]);
        if (inputError) {
            return [...conditionArray, {text: textSegment}, {error: `[${inputError}]`}];
        }

        const inputtedData = getIn(userInput, [fieldNameForPlaceholder]);
        return [...conditionArray, {text: textSegment}, {variable: inputtedData}];
    };
}

function injectMultiFieldsAsObject(userInput, conditionText, userErrors, config) {

    const variableString = (variable, error) => error ? `[${error}]` : variable;

    const strings = config.fields.map(fieldName => {
        return variableString(getIn(userInput, [fieldName]), getIn(userErrors, [fieldName]));
    });

    const fieldErrors = config.fields
        .map(fieldName => getIn(userErrors, [fieldName]))
        .filter(e => e);

    const string = interleave(strings, config.joining);

    const variableKey = fieldErrors.length > 0 ? 'error' : 'variable';

    const splitConditionText = conditionText.split(betweenBrackets).filter(text => text);
    return [
        {text: splitConditionText[0]},
        {[variableKey]: string},
        {text: splitConditionText[1]}
    ];
}

// For pdf
function populateAdditionalConditionsAsString(rawLicence, selectedConditions) {
    return addAdditionalConditions(rawLicence, selectedConditions, injectUserInputAsString);
}

function injectUserInputAsString(condition, userInput) {

    const conditionName = condition.user_input;
    const conditionText = condition.text;
    const fieldPositionObject = condition.field_position;
    const placeHolders = getPlaceholdersFrom(conditionText);

    if (multiFields[conditionName]) {
        return injectMultiFieldsAsString(userInput, conditionText, placeHolders, multiFields[conditionName]);
    }

    return injectUserInputStandardAsString(userInput, conditionText, placeHolders, fieldPositionObject);
}

function injectUserInputStandardAsString(userInput, conditionText, placeHolders, fieldPositionObject) {
    const fieldNames = Object.keys(fieldPositionObject);
    const reducer = injectVariablesIntoString(fieldNames, fieldPositionObject, userInput);
    return placeHolders.reduce(reducer, conditionText);
}

function injectVariablesIntoString(fieldNames, fieldPositionObject, userInput) {
    return (text, placeHolder, index) => {
        const fieldNameForPlaceholder = fieldNames.find(field => fieldPositionObject[field] == index);
        const inputtedData = userInput[fieldNameForPlaceholder];
        return text.replace(placeHolder, inputtedData);
    };
}

function injectMultiFieldsAsString(userInput, conditionText, placeHolder, config) {

    const strings = config.fields.map(fieldName => getIn(userInput, [fieldName]));

    return conditionText.replace(placeHolder, interleave(strings, config.joining));
}

const betweenBrackets = /\[[^\]]*]/g;

function getPlaceholdersFrom(condition) {
    return condition.match(betweenBrackets) || null;
}

const inputsFor = (fieldPositions, formInputs) => {
    const conditionAttributes = Object.keys(fieldPositions);

    return conditionAttributes.reduce((conditionDataObject, formItem) => {
        return {
            ...conditionDataObject,
            [formItem]: formInputs[formItem]
        };
    }, {});
};

function orderForView(a, b) {
    return conditionsOrder.indexOf(a) - conditionsOrder.indexOf(b);
}
