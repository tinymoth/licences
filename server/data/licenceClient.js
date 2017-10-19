const {resolveJsonResponse} = require('./dataAccess/azureJson');
const {getCollection, addRow} = require('./dataAccess/dbMethods');
const TYPES = require('tedious').TYPES;

module.exports = {
    getLicences: function(nomisIds) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT NOMIS_ID as nomisId, ID as id, JSON_QUERY(LICENCE) AS licence 
                         FROM LICENCES WHERE NOMIS_ID IN (${nomisIds.map(id => `'${id}'`).join(',')}) FOR JSON PATH`;

            getCollection(sql, null, resolveJsonResponse(resolve), reject);
        });
    },

    getLicence: function(nomisId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT NOMIS_ID as nomisId, ID as id, JSON_QUERY(LICENCE) AS licence 
                         FROM LICENCES WHERE NOMIS_ID = '${nomisId}' FOR JSON PATH, WITHOUT_ARRAY_WRAPPER`;

            getCollection(sql, null, resolveJsonResponse(resolve), reject);
        });
    },

    createLicence: function(nomisId, licence = {}) {
        return new Promise((resolve, reject) => {
            const sql = 'INSERT INTO LICENCES (NOMIS_ID, LICENCE) ' +
                        'OUTPUT inserted.id ' +
                        'VALUES (@nomisId, @licence)';

            const parameters = [
                {column: 'nomisId', type: TYPES.VarChar, value: nomisId},
                {column: 'licence', type: TYPES.VarChar, value: JSON.stringify(licence)}
            ];

            addRow(sql, parameters, resolve, reject);
        });
    }
};