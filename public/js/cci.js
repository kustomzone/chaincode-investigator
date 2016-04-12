/* global formatDate, $, document, window, in_array, bag */
var selectedPeer = 0;
var lsKey = 'cc_investigator';
var logger = 	{																		//append text to log panel
				log: function log(str1, str2, str3){
					if(str1 && str2 && str3) console.log(str1, str2, str3);
					else if(str1 && str2) console.log(str1, str2);
					else console.log(str1);
					
					var style = 'color: limegreen;';
					if(str1.toLowerCase().indexOf('error') >= 0) style= 'color: #cc0000;';
					
					$('#logs').append('<br/>');
					if(str1) $('#logs').append('<span style="' + style + '">' + pretty_print(str1) + '</span>');
					if(str2) $('#logs').append(pretty_print(str2));
					if(str3) $('#logs').append(pretty_print(str3));
					$('#logs').scrollTop($('#logs')[0].scrollHeight);
			}
};


$(document).ready(function(){
	// ===============================================================================================================
	// 												On Start Up
	// ================================================================================================================
	sizeMe($('#logPanelNav'));
	lets_do_this();
	//localStorage.clear();
	
	function lets_do_this(){																		//load from ls and build up ui
		load_from_ls();
		build_ccs(bag.ls);
		if(bag && bag.cc && bag.cc.details) {
			buildGoQueryFunc(bag.cc.details);														//populate custom go functions panel
			build_peer_options(bag.cc.details.peers);												//populate drop down peer select box
			build_user_options(bag.cc.details.users);
			
			$('#peer').html(bag.cc.details.peers[selectedPeer].name).css('background', '#32CD32');	//populate status panel
			setTimeout(function(){$('#peer').css('background', 'initial');}, 2000);
			$('#name').html(bag.cc.details.deployed_name.substring(0,32) + '...');
		}
	}
	
	// ===============================================================================================================
	// 												jQuery Events
	// ================================================================================================================
	$(document).on('click', '.invokeButton', function(){							//invoke chaincode function
		rest_invoke_peer($(this).attr('func').toLowerCase(), $(this).prev().val());
	});
	
	$(document).on('click', '.queryButton', function(){
		rest_query_peer($(this).attr('func').toLowerCase(), $(this).prev().val());
	});
	
	$(document).on('click', '.queryAllButton', function(){							//query on all the things
		rest_query_all_peers($(this).attr('func').toLowerCase(), $(this).prev().val());
	});
	
	$(document).on('click', '.delcc', function(){									//delete this cc from local storage
		delete_from_ls($(this).parent().attr('hash'));
		console.log('deleted cc');
		bag.cc = {};
		lets_do_this();
		return false;
	});
	
	$('#peers').change(function(){													//select correct memership user for this peer
		selectedPeer = 0;
		for(var i in bag.cc.details.peers){
			if(bag.cc.details.peers[i].api_host + ':' + bag.cc.details.peers[i].api_port == $(this).val()){
				selectedPeer = i;
				break;
			}
		}
		$('#peer').html(bag.cc.details.peers[selectedPeer].name).css('background', '#32CD32');//populate status panel
		setTimeout(function(){$('#peer').css('background', 'initial');}, 2000);		//flashy flashy
		build_user_options(bag.cc.details.users);
		console.log('Selected peer: ', bag.cc.details.peers[selectedPeer].name);
	});
	
	$('#loadjson').click(function(){												//load chaincode summary file from textarea
		try{
			bag.cc = JSON.parse($('#jsonarea').val());
			$('#jsonarea').removeClass('errorBorder');
		}
		catch(e){
			console.log('Error, invalid json');
			$('#jsonarea').addClass('errorBorder');
			return;
		}
		store_to_ls(bag.cc);
		lets_do_this();
	});
	
	$('#barebones').click(function(){												//custom invoke function that SDK did not pick up
		rest_barebones();
	});
	
	$('#sendjson').click(function(){												//send json to SDK for parsing
		var errors = false;
		if($('input[name="deploy_function"]').val() === '') {						//check if empty, error
			errors = true;
			$('input[name="deploy_function"]').addClass('errorBorder');
		}
		if($('input[name="deploy_arg"]').val() === '') {
			errors = true;
			$('input[name="deploy_arg"]').addClass('errorBorder');
		}
		
		console.log(errors, $('input[name="deploy_function"]').val(), $('input[name="deploy_arg"]').val());
		if(!errors){
			$('input[name="deploy_function"]').removeClass('errorBorder');
			$('input[name="deploy_arg"]').removeClass('errorBorder');
			rest_post_chaincode();
		}
	});
	
	$(document).on('click', '.ccSummary', function(){								//load the selected cc
		var hash = $(this).attr('hash');
		console.log('Selected cc: ', hash);
		for(var i in bag.ls){
			if(i == hash){
				bag.cc = bag.ls[i];
				lets_do_this();
				$('#jsonarea').html(JSON.stringify(bag.cc, null, 4));
				copyDetails2InputArea(bag.cc);
				
				if(!$('#jsonarea').is(':visible') && !$('#sdkJsonArea').is(':visible')){	//hold off on closing if these are open
					toggle_panel($('#loadPanelNav'));
					showPanel($('#chaincodePanelNav'));
				}
				break;
			}
		}
	});
	
	$(document).on('click', '#showCreateTextarea', function(){								//show SDK input and init textarea
		if($('#sdkInputWrap').is(':visible')){
			hide_sdk_json_area();
		}
		else{
			var temp = 	{
							network:{
								peers:   [{
									'api_host': 'xxx.xxx.xxx.xxx',
									'api_port': 'xxxxx',
									'id': 'xxxxxx-xxxx-xxx-xxx-xxxxxxxxxxxx_vpx',
									'api_url': 'http://xxx.xxx.xxx.xxx:xxxxx'
								}],
								users:  [{
									'username': 'user0_type0_xxxx',
									'secret': 'xxxxxxxx'
								}]
							},
							chaincode:{
								zip_url: 'https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip',
								unzip_dir: 'marbles-chaincode-master/part2',
								git_url: 'https://github.com/ibm-blockchain/marbles-chaincode/part2',
							}
						};
			$('#sdkInputWrap').fadeIn();
			$('#sdkJsonArea').val(JSON.stringify(temp, null, 4));
		}
		
		sizeMe($('#loadPanelNav'));
	});
	
	$('.tool').click(function(){														//open/close this nav's panel
		toggle_panel(this);
	});
	
	$('#clearLogs').click(function(){													//wipe it out
		$('#logs').html('');
	});
	
	$(window).resize(function() {														//resize nav
		sizeMe($('#loadPanelNav'));
		sizeMe($('#chaincodePanelNav'));
		sizeMe($('#testPanelNav'));
	});
	
	$('#recordButton').click(function(){
		if($(this).hasClass('recordButtonActive')){
			$(this).removeClass('recordButtonActive');
			$('#recordText').html('Record New Test');
			$('#recordNumber').html('');
			bag.recording = false;
		}
		else{
			$(this).addClass('recordButtonActive');
			$('#recordText').html('Stop Recording - ');
			$('#recordNumber').html('0');
			bag.recording = true;
		}
	});
	
	// ===============================================================================================================
	// 												HTTP Functions
	// ================================================================================================================
	//invoke 1 peer
	function rest_invoke_peer(func, args, cb){
		var temp = null;
		try{
			temp = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = {																//build our body up
						'chaincodeSpec': {
							'type': 'GOLANG',
							'chaincodeID': {
								name: bag.cc.details.deployed_name,
							},
							'ctorMsg': {
								'function': func,
								'args': temp
							},
							'secureContext': $('select[name="membershipUser"]').val()
						}
					};
		logger.log('invoking func', func, data);
		$.ajax({
			method: 'POST',
			url: 'http://' + $('select[name="peer"]').val() + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				logger.log('Success', json);
			},
			error: function(e){
				logger.log('Error', e);
			}
		});
	}
	
	//query 1 peer
	function rest_query_peer(func, args, cb){
		var temp = null;
		try{
			temp = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = {																//build our body up
						'chaincodeSpec': {
							'type': 'GOLANG',
							'chaincodeID': {
								name: bag.cc.details.deployed_name,
							},
							'ctorMsg': {
								'function': func,
								'args': temp
							},
							'secureContext': $('select[name="membershipUser"]').val()
						}
					};
		logger.log('querying func', func, data);
		
		$.ajax({
			method: 'POST',
			url: 'http://' + $('select[name="peer"]').val() + '/devops/query',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				logger.log('Success - read', JSON.stringify(json));
				if(cb) cb(null, json);
			},
			error: function(e){
				logger.log('Error - read', e);
				if(cb) cb(e, null);
			}
		});
	}
	
	//query all the peers
	function rest_query_all_peers(func, args, cb){
		//var func = $(this).attr('func').toLowerCase();
		//var args = $(this).prev().val();
		var temp = null;
		try{
			temp = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = {																//build our body up
						'chaincodeSpec': {
							'type': 'GOLANG',
							'chaincodeID': {
								name: bag.cc.details.deployed_name,
							},
							'ctorMsg': {
								'function': func,
								'args': temp
							},
							'secureContext': $('select[name="membershipUser"]').val()
						}
					};
		logger.log('querying func', func, data);
		
		for(var i in bag.cc.details.peers){
			data.chaincodeSpec.secureContext = bag.cc.details.peers[i].enrollID;					//get the right user for this peer
			$.ajax({
				method: 'POST',
				url: 'http://' + bag.cc.details.peers[i].api_host + ':' + bag.cc.details.peers[i].api_port + '/devops/query',
				data: JSON.stringify(data),
				peer_name: bag.cc.details.peers[i].name,
				contentType: 'application/json',
				success: function(json){
					logger.log('Success - read all', this.peer_name, JSON.stringify(json));
					if(cb) cb(null, json);
				},
				error: function(e){
					logger.log('Error - read all', this.peer_name, e);
					if(cb) cb(e, null);
				}
			});
		}
	}
	
	//invoke barebones
	function rest_barebones(){
		logger.log('Invoking Function ' + $('input[name="func_name"]').val());
		var arg = $('input[name="func_val"]').val();
		try{
			arg = try_to_parse(arg);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = {
						'chaincodeSpec': {
							'type': 'GOLANG',
							'chaincodeID': {
								name: bag.cc.details.deployed_name,
							},
							'ctorMsg': {
								'function': $('input[name="func_name"]').val(),
								'args': arg
							},
							'secureContext': $('select[name="membershipUser"]').val()
						}
					};

		$.ajax({
			method: 'POST',
			url: 'http://' + $('select[name="peer"]').val() + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				logger.log('Success', json);
			},
			error: function(e){
				logger.log('Error', e);
			}
		});
	}
	
	//send cc to sdk
	function rest_post_chaincode(cb){
		logger.log('Sending chaincode to SDK');
		$('#sdkLoading').fadeIn();
		var data = $('#sdkJsonArea').val();
		
		try{
			data = JSON.parse(data);												//check if input is valid JSON
			data.deploy_function = $('input[name="deploy_function"]').val();
			data.deploy_arg = JSON.parse('[' + $('input[name="deploy_arg"]').val().toString() + ']');
			$('#sdkJsonArea').removeClass('errorBorder');
		}
		catch(e){
			logger.log('Error - Input is not JSON, go fish', e);
			$('#sdkLoading').fadeOut();
			$('#sdkJsonArea').addClass('errorBorder');
			return;
		}
		//console.log(data);
		
		$.ajax({
			method: 'POST',
			url: window.location.origin + '/chaincode',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				json.deploy_function = $('input[name="deploy_function"]').val();
				json.deploy_arg = JSON.parse('[' + $('input[name="deploy_arg"]').val() + ']');
				logger.log('Success - sending chaincode to sdk', json);
				$('#sdkLoading').fadeOut();
				hide_sdk_json_area();
				store_to_ls(json);
				lets_do_this();
				if(cb) cb(null, json);
			},
			error: function(e){
				logger.log('Error - sending chaincode to sdk', e);
				$('#sdkLoading').fadeOut();
				hide_sdk_json_area();
				if(cb) cb(e, null);
			}
		});
	}
	
	// ===============================================================================================================
	// 												Build UI Fun
	// ===============================================================================================================
	function buildGoQueryFunc(cc){
		var html = '';
		var i = 0;
		var field = '<input class="arginput" type="text" placeholder="array of strings"/>';
		$('input').val('');
		
		if(cc && cc.func && cc.func.query){
			for(i in cc.func.query){
				html += '<div class="func">Query - ' + cc.func.query[i] + '([ ' + field + ']);';
				html += 	'<button type="button" class="queryButton" func="' + cc.func.query[i] + '"> Run&nbsp;<span class="fa fa-arrow-right"></span> </button>&nbsp;&nbsp;';
				html += 	'<button type="button" class="queryAllButton" func="' + cc.func.query[i] + '"> Run All&nbsp;<span class="fa fa-random"></span> </button>&nbsp;&nbsp;';
				html += '</div>';
			}
			$('#customgowrap').html(html);
			$('#giturl').html(cc.git_url);
		}
		
		buildGoInvokeFunc(cc);
	}
	
	function buildGoInvokeFunc(cc){
		var html = '';
		var i = 0;
		var field = '<input class="arginput" type="text" placeholder="array of strings"/>';
		$('input').val('');
		
		if(cc && cc.func && cc.func.invoke){
			for(i in cc.func.invoke){
				html += '<div class="func">Invoke - ' + cc.func.invoke[i] + '([ ' + field + ']);';
				html += 	'<button type="button" class="invokeButton" func="' + cc.func.invoke[i] + '"> Run&nbsp;<span class="fa fa-arrow-right"></span> </button>&nbsp;&nbsp;';
				html += '</div>';
			}
			$('#customgowrap').append(html);
		}
	}
	
	function build_ccs(ccs){															//build parsed chaincode options
		var html = '';
		//console.log('building cc', ccs);
		for(var i in ccs){
			var pos = ccs[i].details.git_url.lastIndexOf('/');
			var text = ccs[i].details.git_url.substring(pos + 1).substring(0, 8);		//lets make a better short name
			var timestamp = Date.now();													//if no date, just make it today
			if(ccs[i].details.timestamp) timestamp = ccs[i].details.timestamp;
			text += ' ' + formatDate(timestamp, '%M/%d');
			text += ' ' + ccs[i].details.deployed_name.substring(0, 6);
			
			if(ccs[i].details){
				html += '<div class="ccSummary" hash="' + ccs[i].details.deployed_name + '" title="' + ccs[i].details.git_url + '">';
				html += 		text;
				html +=		'<div class="delcc fa fa-remove" title="remove chaincode"></div>';
				html += '</div>';
			}
		}
		$('#chaincodes').html(html);
	}
	
	function build_peer_options(peers){													//peer select options
		if(peers){
			peers.sort(function(a, b) {													//alpha sort me
				var textA = a.id.toUpperCase();
				var textB = b.id.toUpperCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});
			var html = '';
			for(var i in peers){
				html += '<option value="' + peers[i].api_host + ':' + peers[i].api_port + '">' + peers[i].name + '</option>';
			}
			$('#peers').html(html);
		}
	}
	
	function build_user_options(users){													//user select options
		var html  = '';
		if(users){
			for(var i in users){
				var selected = '';
				if(bag.cc.details.peers[selectedPeer].enrollID == users[i].username) selected= 'selected="selected"';
				html += '<option ' + selected + '>' + users[i].username + '</option>';
			}
		}
		$('#users').html(html);
	}
	
	function toggle_panel(me){															//open/close the panel for this nav
		if($(me).hasClass('toolClosed')){
			showPanel(me);																//show this panel
		}
		else{
			$(me).removeClass('toolOpen').addClass('toolClosed');
			$(me).find('.toollegendOpen').removeClass('toollegendOpen').addClass('toollegendClosed');
			$('#' + $(me).attr('show')).hide();											//hide the panel
			$(me).find('.stepNumberOpen').removeClass('stepNumberOpen').addClass('stepNumberClosed');
			$(me).css('height', 'initial').css('line-height', 'initial');				//change height back
		}
	}
	
	function showPanel(me){																//show the panel for this nav
		$(me).removeClass('toolClosed').addClass('toolOpen');
		$(me).find('.toollegendClosed').removeClass('toollegendClosed').addClass('toollegendOpen');
		$('#' + $(me).attr('show')).fadeIn().css('display','inline-block');
		$(me).find('.stepNumberClosed').removeClass('stepNumberClosed').addClass('stepNumberOpen');
		sizeMe(me);
	}
	
	function sizeMe(me){
		if($(me).hasClass('toolOpen')){													//only resize if its open
			var height = $('#' + $(me).attr('show')).css('height');
			var pos = height.indexOf('px');
			height = height.substring(0, pos);
			
			if(height > 100) height = height - 92;										//for some reason this helps
			
			$(me).css('height', height).css('line-height', height + 'px');
		}
	}
	
	/*
	tests : [
		{
			name: "abc",
			story:[
				{
					
				}
			],
			timestamp:
		}
	]
	*/
	var temp =  [
		{
			name: 'abc',
			story:[
				{
					function_name: 'init_marble',
					args: 'stuff'
				}
			],
			timestamp: Date.now()
		}
	];
	build_tests(temp);
	function build_tests(tests){														//build parsed chaincode options
		var html = '';
		//console.log('building cc', ccs);
		for(var i in tests){
			var text = tests[i].name.substr(0, 8);
			var timestamp = Date.now();													//if no date, just make it today
			if(tests[i].timestamp) timestamp = tests[i].timestamp;
			text += '<br/>' + formatDate(timestamp, '%M/%d');
			text += '<br/>(' + tests[i].story.length + ')';
		
			html += '<div class="testSummary" name="' + tests[i].name+ '" title="' + tests[i].name + '">';
			html += 		text;
			html +=		'<div class="deltest fa fa-remove" title="remove test"></div>';
			html += '</div>';
		}
		$('#testsList').html(html);
	}
	
	
// ===============================================================================================================
// 												Helper Fun
// ===============================================================================================================
	function hide_sdk_json_area(){
		$('#sdkInputWrap').hide();
		sizeMe($('#loadPanelNav'));
	}
	
	function load_from_ls(){
		if(window.localStorage) {
			var str = window.localStorage.getItem(lsKey);
			if(str){
				bag.ls = JSON.parse(str);
				console.log('local storage', bag.ls);
				return bag.ls;
			}
		}
	}
	
	function store_to_ls(cc){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		console.log('?');
					
		load_from_ls();
		if(cc.details && cc.details.deployed_name){
			console.log('saving local storage');
			bag.ls[cc.details.deployed_name] = cc;									//store this cc
		}
		window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save new one
	}
	
	function delete_from_ls(deployed_name){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		
		load_from_ls();
		if(bag.ls && deployed_name){
			console.log('removing', deployed_name);
			delete bag.ls[deployed_name];											//remove this cc
		}
		window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save
	}
});

function pretty_print(str){															//json pretty print if obj
	if(str.constructor === Object || str.constructor === Array){
		return JSON.stringify(str, null, 4);
	}
	else{
		return str + ' ';
	}
}

function copyDetails2InputArea(cc){													//copy only need stuff over
	for(var i in cc.details.peers){
		if(cc.details.peers[i].ssl) cc.details.peers[i].api_url = 'https://';
		else  cc.details.peers[i].api_url = 'http://';
		cc.details.peers[i].api_url += cc.details.peers[i].api_host + ':' + cc.details.peers[i].api_port;
	}
	var temp = {
				'network': {
					'peers': cc.details.peers,
					'users': cc.details.users
				},
				'chaincode': {
					'zip_url': cc.details.zip_url,
					'unzip_dir': cc.details.unzip_dir,
					'git_url': cc.details.git_url
				}
			};
	if(cc.details.deployed_name) temp.chaincode.deployed_name = cc.details.deployed_name;
	$('#sdkJsonArea').val(JSON.stringify(temp, null, 4));
	
	if(cc.deploy_function) $('input[name="deploy_function"]').val(cc.deploy_function);
	if(cc.deploy_arg){
		var str = JSON.stringify(cc.deploy_arg);
		$('input[name="deploy_arg"]').val(str.substring(1, str.length-1));
	}
}

//things that should pass: null, "test", test, 9, "9", true, {"hi":"there"}, [0,9]
function try_to_parse(str){
	var ret = [];
	
	if(str !== 'null'){
		try{
			ret = JSON.parse('[' + str.toString() + ']');		//try this first
		}
		catch(e){
			ret = JSON.parse('["' + str.toString() + '"]');		//now try this one
		}
		
		for(var i in ret){
			if(typeof ret[i] === 'object'){
				ret[i] = JSON.stringify(ret[i]);
			}
			else{
				ret[i] = ret[i].toString();						//everything must be a string
			}
		}
	}
	return ret;
}