let app;
let bootError;

try {
  app = require('./src/app');
} catch (error) {
  bootError = error;
  console.error('Failed to boot Updaterw API:', error);
}

module.exports = async (req, res) => {
  if (bootError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      message: 'API failed to start',
      error: bootError.message,
    }));
    return;
  }

  return app(req, res);
};
