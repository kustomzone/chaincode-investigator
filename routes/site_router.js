/* global __dirname */
"use strict";
/* global process */
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
var Ibc1 = require('ibm-blockchain-js');
var ibc = new Ibc1();

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
	var options = 	{
						network:{
							peers: null,
							users: null,
						},
						chaincode:{
							zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
							unzip_dir: 'marbles-chaincode-master/part2',											//subdirectroy name of chaincode after unzipped
							git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/part2',					//GO git http url
						
							//hashed cc name from prev deployment
							deployed_name: '8fe7b3d9a3d43c5b6b91d65b0585366fa3d560d5362e11f0eea11ff614a296fdec8607b17de429c919975d5386953e4dac486a09ce6c965f5844d7d183825efb'
						}
					};
	ibc.load(options, cb_ready);																//parse/load chaincode

	var chaincode = null;
	function cb_ready(err, cc){																	//response has chaincode functions
		if(err != null){
			console.log('! looks like an error loading the chaincode, app will fail\n', err);
			if(!process.error) process.error = {type: 'load', msg: err.details};				//if it already exist, keep the last error
		}
		else{
			chaincode = cc;
		}
	}
});




module.exports = router;