"use strict";
/*******************************************************************************
 * Copyright (c) 2015 IBM Corp.
 *
 * All rights reserved. 
 *
 * Contributors:
 *   David Huffman - Initial implementation
 *******************************************************************************/
var express = require('express');
var router = express.Router();
var fs = require("fs");
var setup = require('../setup.js');
var path = require('path');

// Load our modules.
var aux     = require("./site_aux.js");
var rest    = require("../utils/rest.js");
var Ibc1 	= require('ibm-blockchain-js');

// ============================================================================================================================
// Home
// ============================================================================================================================
router.route("/").get(function(req, res){
	res.redirect('/cci');
});

// ============================================================================================================================
// Chaincode Investigator
// ============================================================================================================================
router.route("/cci").get(function(req, res){
	res.render('investigate', {title: 'Chaincode Investigator', bag: {setup: setup}} );
});

// ============================================================================================================================
// POST /chaincode
// ============================================================================================================================
router.route("/chaincode").post(function(req, res){
	console.log('here');
	var ibc = new Ibc1();
	ibc.load(req.body, cb_ready);																//parse/load chaincode

	function cb_ready(err, cc){																	//response has chaincode functions
		if(err != null){
			console.log('! looks like an error loading the chaincode, app will fail\n', err);
			res.status(err.code).json(err);
		}
		else{
			console.log('made it?');
			res.status(200).json(cc.details);
		}
	}
});


module.exports = router;