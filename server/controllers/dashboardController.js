const logger = require('../../log');
const audit = require('../data/audit');

const {getUpcomingReleases} = require('../data/api');
const {getLicences} = require('../data/licences');

exports.getIndex = function(req, res) {

    const user = getLoggedInUserId();

    audit.record('VIEW_DASHBOARD', user);

    return getDashboardDetail(res, user);
};

function getLoggedInUserId() {
    // todo
    return '1';
}

async function getDashboardDetail(res, user) {

    try {
        const upcomingReleases = await getUpcomingReleases(user);

        if (isEmpty(upcomingReleases)) {
            return res.render('dashboard/index');
        }

        const activeLicences = await getLicences(getOffenderNomisIds(upcomingReleases));
        const dashboardInfo = parseDashboardInfo(upcomingReleases, activeLicences);

        return res.render('dashboard/index', dashboardInfo);


    } catch (error) {
        logger.error('Error during getDashboardDetail: ', error.message);
        return renderErrorPage(res, error);
    }
}

function isEmpty(candidateArray) {
    return !candidateArray || candidateArray.length <= 0;
}

function getOffenderNomisIds(releases) {
    return releases.map(offender => offender.nomisId);
}

function parseDashboardInfo(upcomingReleases, activeLicences) {

    const required = upcomingReleases.map(offender => {
        const licence = activeLicences.find(licence => licence.nomisId === offender.nomisId);

        if(licence) {
            const licenceLocator = {inProgress: true, licenceId: licence.id};
            return {...offender, ...licenceLocator};
        }

        return offender;
    });

    return {
        required,
        // to do add 'sent' licences
        moment: require('moment')
    };
}


function renderErrorPage(res, err) {
    logger.error('Error getting dashboard info ', {error: err});
    res.status(500);
    res.render('dashboard/index', {
        err: {
            title: 'Unable to talk to the database',
            desc: 'Please try again'
        }
    });
}