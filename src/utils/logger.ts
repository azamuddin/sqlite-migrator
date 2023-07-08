import logger from 'node-color-log';

if (process.env.NODE_ENV !== 'production') {
  logger.setLevel('disable');
}

export {logger};
