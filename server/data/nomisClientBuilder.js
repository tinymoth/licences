const logger = require('../../log');
const config = require('../config');
const {merge, pipe} = require('../utils/functionalHelpers');
const superagent = require('superagent');
const {NoTokenError} = require('../utils/errors');

const timeoutSpec = {
    response: config.nomis.timeout.response,
    deadline: config.nomis.timeout.deadline
};

const apiUrl = config.nomis.apiUrl;
const invalidDate = 'Invalid date';

module.exports = token => {

    const nomisGet = nomisGetBuilder(token);
    const addReleaseDatesToPrisoner = pipe(
        addReleaseDate,
        addEffectiveConditionalReleaseDate,
        addEffectiveAutomaticReleaseDate
    );

    return {
        getUpcomingReleasesByOffenders: function(nomisIds) {
            const path = `${apiUrl}/offender-releases`;
            const query = {offenderNo: nomisIds}; // todo add cutoff date
            const headers = {'Page-Limit': nomisIds.length};
            return nomisGet({path, query, headers});
        },

        getBooking: function(bookingId) {
            const path = `${apiUrl}/bookings/${bookingId}`;
            return nomisGet({path});
        },

        getAliases: function(bookingId) {
            const path = `${apiUrl}/bookings/${bookingId}/aliases`;
            return nomisGet({path});
        },

        getIdentifiers: function(bookingId) {
            const path = `${apiUrl}/bookings/${bookingId}/identifiers`;
            return nomisGet({path});
        },

        getMainOffence: function(bookingId) {
            const path = `${apiUrl}/bookings/${bookingId}/mainOffence`;
            return nomisGet({path});
        },

        getComRelation: function(bookingId) {
            const path = `${apiUrl}/bookings/${bookingId}/relationships`;
            const query = {relationshipType: 'COM'};
            return nomisGet({path, query});
        },

        getImageInfo: function(imageId) {
            const path = `${apiUrl}/images/${imageId}`;
            return nomisGet({path});
        },

        getHdcEligiblePrisoners: async function() {
            const path = `${apiUrl}/offender-sentences/home-detention-curfew-candidates`;
            const headers = {'Page-Limit': 10000};

            const prisoners = await nomisGet({path, headers});
            return prisoners.map(addReleaseDatesToPrisoner);
        },

        getOffenderSentences: async function(nomisIds) {
            const path = `${apiUrl}/offender-sentences`;
            const query = {offenderNo: nomisIds};
            const headers = {'Page-Limit': 10000};

            const prisoners = await nomisGet({path, query, headers});
            return prisoners.map(addReleaseDatesToPrisoner);
        },

        getImageData: async function(id) {
            const path = `${apiUrl}/images/${id}/data`;
            return nomisGet({path, responseType: 'blob'});
        },

        getROPrisoners: async function(deliusUserName) {
            const path = `${apiUrl}/offender-relationships/externalRef/${deliusUserName}/COM`;
            return nomisGet({path});
        },

        getEstablishment: async function(agencyLocationId) {
            const path = `${apiUrl}/agencies/prison/${agencyLocationId}`;
            return nomisGet({path});
        },

        getPrisoners: async function(query) {
            const path = `${apiUrl}/prisoners`;
            return nomisGet({path, query});
        }
    };
};

function nomisGetBuilder(token) {

    return async ({path, query = '', headers = {}, responseType = ''} = {}) => {

        if (!token) {
            throw new NoTokenError();
        }

        try {
            const result = await superagent
                .get(path)
                .query(query)
                .set('Authorization', token)
                .set('Elite-Authorization', token)
                .set(headers)
                .responseType(responseType)
                .timeout(timeoutSpec);

            return result.body;

        } catch (error) {

            logger.warn('Error calling nomis');
            logger.warn(error);

            throw error;
        }
    };
}


function findFirstValid(datesList) {
    return datesList.find(date => date && date !== invalidDate) || null;
}

function addEffectiveConditionalReleaseDate(prisoner) {
    const {
        conditionalReleaseDate,
        conditionalReleaseOverrideDate
    } = prisoner.sentenceDetail;

    const crd = findFirstValid([conditionalReleaseOverrideDate, conditionalReleaseDate]);

    return {
        ...prisoner,
        sentenceDetail: merge(prisoner.sentenceDetail, {effectiveConditionalReleaseDate: crd})
    };
}

function addEffectiveAutomaticReleaseDate(prisoner) {
    const {
        automaticReleaseDate,
        automaticReleaseOverrideDate
    } = prisoner.sentenceDetail;

    const ard = findFirstValid([automaticReleaseOverrideDate, automaticReleaseDate]);

    return {
        ...prisoner,
        sentenceDetail: merge(prisoner.sentenceDetail, {effectiveAutomaticReleaseDate: ard})
    };
}

function addReleaseDate(prisoner) {
    const {
        automaticReleaseDate,
        automaticReleaseOverrideDate,
        conditionalReleaseDate,
        conditionalReleaseOverrideDate
    } = prisoner.sentenceDetail;

    const releaseDate = findFirstValid([
        conditionalReleaseOverrideDate,
        conditionalReleaseDate,
        automaticReleaseOverrideDate,
        automaticReleaseDate
    ]);

    return {
        ...prisoner,
        sentenceDetail: merge(prisoner.sentenceDetail, {releaseDate})
    };
}
