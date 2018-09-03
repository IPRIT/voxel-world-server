import express from 'express';
import * as methods from './methods';

const router = express.Router();

router.get( '/status', methods.getGameStatusRequest );

export {
  router
};