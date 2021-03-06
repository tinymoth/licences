const logger = require('./log');
const config = require('./server/config');
const app = require('./server/index');
const healthcheck = require('./server/healthcheck');

if (config.healthcheckInterval) {
    reportHealthcheck();
    setInterval(reportHealthcheck, config.healthcheckInterval * 60 * 1000);
}

function reportHealthcheck() {
    healthcheck(recordHealthResult);
}

function recordHealthResult(err, results) {
    if (err) {
        logger.error('healthcheck failed', err);
        return;
    }
    logger.info('healthcheck', results);
}

app.listen(app.get('port'), function() {
    logger.info('Licences server listening on port ' + app.get('port'));
});

