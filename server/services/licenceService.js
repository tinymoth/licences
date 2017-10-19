const {createLicenceObject} = require('../utils/licenceFactory');

module.exports = function createLicenceService(licenceClient) {
    async function getLicence(nomisId) {
        try {
            return await licenceClient.getLicence(nomisId);
        } catch(error) {
            throw error;
        }
    }

    async function createLicence(nomisId, data = {}) {

        const licence = createLicenceObject(data);

        try {
            return await licenceClient.createLicence(nomisId, licence);
        } catch(error) {
            throw error;
        }
    }

    return {getLicence, createLicence};
};