import express from 'express';
import bodyParser from 'body-parser';
import { router as gameRouter } from "./game";

const router = express.Router();

router.use( bodyParser.json() );
router.use( bodyParser.urlencoded({ extended: false }) );

router.use( '/game', gameRouter );

export {
  router
};