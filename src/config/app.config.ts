export default () => ({
  appName: process.env.APP_NAME || 'DefaultAppName',
  port: parseInt(process.env.PORT || '3000', 10),
})