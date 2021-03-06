const express = require('express');
const {asyncMiddleware, checkLicenceMiddleWare} = require('../utils/middleware');
const {templates} = require('./config/pdf');
const {firstItem} = require('../utils/functionalHelpers');

module.exports = function(
    {logger, pdfService, prisonerService, authenticationMiddleware, licenceService, conditionsService, audit}) {

    const router = express.Router();
    router.use(authenticationMiddleware());

    router.use(function(req, res, next) {
        if (typeof req.csrfToken === 'function') {
            res.locals.csrfToken = req.csrfToken();
        }
        next();
    });

    const checkLicence = checkLicenceMiddleWare(licenceService, prisonerService);

    router.get('/select/:nomisId', checkLicence, asyncMiddleware(async (req, res) => {
        const {nomisId} = req.params;

        const prisoner = await prisonerService.getPrisonerPersonalDetails(nomisId, req.user.token);
        const errors = firstItem(req.flash('errors')) || {};

        return res.render('pdf/select', {nomisId, templates, prisoner, errors});
    }));

    router.post('/select/:nomisId', (req, res) => {
        const {nomisId} = req.params;
        const {decision} = req.body;

        const templateIds = templates.map(template => template.id);

        if (decision === '' || !templateIds.includes(decision)) {
            req.flash('errors', {decision: 'Select a licence type'});
            return res.redirect(`/hdc/pdf/select/${nomisId}`);
        }

        res.redirect(`/hdc/pdf/taskList/${decision}/${nomisId}`);
    });

    router.get('/taskList/:templateName/:nomisId', checkLicence, asyncMiddleware(async (req, res) => {

        const {nomisId, templateName} = req.params;
        const {licence} = res.locals;
        logger.debug(`GET pdf/taskList/${templateName}/${nomisId}`);

        const templateConfig = templates.find(template => template.id === templateName);
        if (!templateConfig) {
            throw new Error('Invalid licence template name');
        }

        const templateTitle = templateConfig.label;

        const [prisoner, {missing}] = await Promise.all([
            prisonerService.getPrisonerPersonalDetails(nomisId, req.user.token),
            pdfService.getPdfLicenceData(templateName, nomisId, licence, req.user.token)
        ]);

        const incompleteGroups = Object.keys(missing);
        const canPrint = !incompleteGroups.find(group => missing[group].mandatory);

        return res.render('pdf/createLicenceTaskList', {
            nomisId,
            missing,
            templateName,
            prisoner,
            templateTitle,
            incompleteGroups,
            canPrint
        });
    }));

    router.get('/missing/:section/:templateName/:nomisId', checkLicence, asyncMiddleware(async (req, res) => {

        const {nomisId, templateName, section} = req.params;
        const {licence} = res.locals;
        logger.debug(`GET pdf/missing/${section}/${templateName}/${nomisId}`);

        const [prisoner, {missing}] = await Promise.all([
            prisonerService.getPrisonerPersonalDetails(nomisId, req.user.token),
            pdfService.getPdfLicenceData(templateName, nomisId, licence, req.user.token)
        ]);

        const data = {};

        return res.render(`pdf/missing/${section}`, {
            nomisId,
            missing,
            templateName,
            prisoner,
            data
        });
    }));

    router.get('/create/:templateName/:nomisId', checkLicence, asyncMiddleware(async (req, res) => {

        const {nomisId, templateName} = req.params;
        const {licence} = res.locals;
        logger.debug(`GET pdf/create/${nomisId}/${templateName}`);

        const pdf = await pdfService.generatePdf(templateName, nomisId, licence, req.user.token);

        audit.record('CREATE_PDF', req.user.staffId, {templateName, nomisId});

        res.type('application/pdf');
        return res.end(pdf, 'binary');
    }));

    return router;
};
