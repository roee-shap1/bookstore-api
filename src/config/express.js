'use strict;'

const fs = require('fs');

const router = require('express').Router();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const helmet = require('helmet');
const Limiter = require('express-rate-limit');
const compress = require('compression');
const cors = require('cors');

const corsOptionsDelegate = (req, callback) => {
	const whitelist = [
		'http://localhost:4200',
		'http://217.132.174.228',
		'http://217.132.174.228:4200'
	];
	callback(null, {
		origin: (origin, callback) => {
			if(whitelist.indexOf(origin) !== -1) callback(null, true);
			else callback(new Error('Not allowed by CORS.'));
		},
		optionsSuccessStatus: 200
	});
};

const dbURI = 'mongodb://bookkeeper:qwerty_123@ds221339.mlab.com:21339/bookstore';
// const dbURI = 'mongodb://0.0.0.0:27017/bookstore';

router.use(helmet());
router.options('*', cors());
router.use(cors());
router.use(bodyParser.json());

mongoose.connect(dbURI)
	.then(() => {console.log(`You have been successfully connected to the database.`)})
	.catch(err => console.error(`connection error: ${err}`));
const db = mongoose.connection;
db.on('error', (err) => console.error(`connection error: ${err}`));

router.use((req, res, next) => {
	req.connection.setNoDelay(true);
	next();
});

router.use(compress({
	filter: (req, res) => {
		if (req.headers['x-no-compression']) return false;
		else return compress.filter(req, res);
	},
	level: -1
}));

router.use(new Limiter({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 200, // limit each IP to 200 requests per windowMs
	delayMs: 2 * 1000, // disable delaying - full speed until the max limit is reached
	delayAfter: 5
}));

router.use(express.static(__dirname + '/../public', {
	immutable: true,
	maxAge: 2 * 24 * 60 * 60 * 1000
}));

router.use('/', require('./routes'));

module.exports = router;
