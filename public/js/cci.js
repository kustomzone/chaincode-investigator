/* global formatDate, $, document, window, bag */
var selectedPeerIndex = 0;
var selectedCChash = '';
var lsKey = 'cc_investigator';
var recordedActions = {};
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
		build_ccs(bag.ls.ccs);
		if(bag.ls.ccs && bag.ls.ccs[selectedCChash]) build_recordings(bag.ls.ccs[selectedCChash].recordings);
		if(selectedCChash !== '' && bag && bag.ls && bag.ls.ccs && bag.ls.ccs[selectedCChash]) {
			buildGoQueryFunc(bag.ls.ccs[selectedCChash].details);														//populate custom go functions panel
			build_peer_options(bag.ls.ccs[selectedCChash].details.peers);												//populate drop down peer select box
			build_user_options(bag.ls.ccs[selectedCChash].details.users);
			
			$('#peer').html(bag.ls.ccs[selectedCChash].details.peers[selectedPeerIndex].name);	//populate status panel
			setTimeout(function(){$('#peer').css('background', 'initial');}, 2000);
			$('#name').html(bag.ls.ccs[selectedCChash].details.deployed_name.substring(0,32) + '...');
		}
	}
	
	// ===============================================================================================================
	// 												jQuery Events
	// ================================================================================================================
	$(document).on('click', '.invokeButton', function(){							//invoke chaincode function
		rest_invoke_peer($(this).attr('func'), $(this).prev().val());
	});
	
	$(document).on('click', '.queryButton', function(){
		rest_query_peer($(this).attr('func'), $(this).prev().val());
	});
	
	$(document).on('click', '.queryAllButton', function(){							//query on all the things
		rest_query_all_peers($(this).attr('func'), $(this).prev().prev().val());
	});
	
	$('#invoke_barebones').click(function(){										//custom invoke function that SDK did not pick up
		rest_invoke_barebones();
	});
	
	$('#query_barbones').click(function(){											//custom invoke function that SDK did not pick up
		rest_query_barebones();
	});
	
	//remove cc from local storage
	$(document).on('click', '.delcc', function(){									//delete this cc from local storage
		delete_from_ls($(this).parent().attr('hash'));
		console.log('deleted cc');
		selectedCChash = '';
		lets_do_this();
		return false;
	});
	
	//remove recording from local storage
	$(document).on('click', '.delrecord', function(){								//delete this cc from local storage
		delete_recording_from_ls($(this).parent().attr('pos'));
		console.log('deleted recording');
		lets_do_this();
		return false;
	});
	
	//peer manual selection from dropdown
	$('#peers').change(function(){													//select correct memership user for this peer
		selectedPeerIndex = 0;
		for(var i in bag.ls.ccs[selectedCChash].details.peers){
			if(bag.ls.ccs[selectedCChash].details.peers[i].api_host + ':' + bag.ls.ccs[selectedCChash].details.peers[i].api_port == $(this).val()){
				selectedPeerIndex = i;
				break;
			}
		}
		$('#peer').html(bag.ls.ccs[selectedCChash].details.peers[selectedPeerIndex].name);//populate status panel
		setTimeout(function(){$('#peer').css('background', 'initial');}, 2000);		//flashy flashy
		build_user_options(bag.ls.ccs[selectedCChash].details.users);
		console.log('Selected peer: ', bag.ls.ccs[selectedCChash].details.peers[selectedPeerIndex].name);
	});
	
	//load json in textarea and send to sdk
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
	
	//load selected chaincode icon
	$(document).on('click', '.ccSummary', function(){								//load the selected cc
		var hash = $(this).attr('hash');
		console.log('Selected cc: ', hash);
		for(var i in bag.ls.ccs){
			if(i == hash){
				selectedCChash = i;
				lets_do_this();
				$('#jsonarea').html(JSON.stringify(bag.ls.ccs[selectedCChash], null, 4));
				copyDetails2InputArea(bag.ls.ccs[selectedCChash]);
				
				if(!$('#jsonarea').is(':visible') && !$('#sdkJsonArea').is(':visible')){//hold off on closing if these are open
					toggle_panel($('#loadPanelNav'));
					showPanel($('#chaincodePanelNav'));
				}
				break;
			}
		}
	});
	
	//show/hide json text area panel
	$(document).on('click', '#showCreateTextarea', function(){							//show SDK input and init textarea
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
	
	//record actions
	$('#recordButton').click(function(){
		if($(this).hasClass('recordButtonActive')){										//stop recording and store
			$(this).removeClass('recordButtonActive');
			$('#recordText').html('Record New Test');
			$('#recordNumber').html('');
			bag.recording = false;
			console.log('i see', recordedActions);
			store_recoding_to_ls(recordedActions);
		}
		else{																			//start recording
			clearRecording();
			$(this).addClass('recordButtonActive');
			$('#recordText').html('Stop Recording - ');
			$('#recordNumber').html('0');
			$('input[name="recording_name"]').fadeIn();
			bag.recording = true;
		}
	});
	
	var selectedRecording = {};
	$('#playButton').hide();
	$(document).on('click', '.testSummary', function(){
		if($(this).hasClass('selectedRecording')){
			console.log('stoping playback');
			stop_playback();
		}
		else{
			console.log('loading playback');
			selectedRecording = bag.ls.ccs[selectedCChash].recordings[$(this).attr('pos')];
			$('.selectedRecording').removeClass('selectedRecording');
			$('input[name="recording_name"]').val(selectedRecording.name);
			$(this).addClass('selectedRecording');
			$('#playButton').fadeIn();
			$('input[name="recording_name"]').fadeIn();
			console.log('selected', selectedRecording);
		}
	});
	
	$('#playButton').click(function(){
		console.log('playing', selectedRecording);
		rest_play_recording(selectedRecording, 0);
	});
	
	
	$('input[name="recording_name"]').keyup(function(){
		if(bag.recording){													//create name for test we are recording right now
			recordedActions.name = $(this).val();
		}
	});
	
	$(document).on('keyup', '.recordingName', function(){					//overwrite name for test
		selectedRecording = bag.ls.ccs[selectedCChash].recordings[$(this).parent().attr('pos')]; //select it first
		selectedRecording.name = $(this).val();
		store_recoding_to_ls(selectedRecording, $('.selectedRecording').attr('pos'));			//save it 
	});
	
	function stop_playback(){
		console.log('unselecting');
		selectedRecording = {};
		$('.selectedRecording').removeClass('selectedRecording');
		$('#playButton').fadeOut();
		$('input[name="recording_name"]').fadeOut();
	}
	
	// ===============================================================================================================
	// 												HTTP Functions
	// ================================================================================================================
	//format body
	function build_rest_body(type, func, args){
		showPanel($('#logPanelNav'));
		return 	{																			//build our body up
					'jsonrpc': '2.0',
					'method': type,
					'params': {
						'type': 1,
						'chaincodeID': {
							'name': bag.ls.ccs[selectedCChash].details.deployed_name
						},
						'ctorMsg': {
							'function': func,
								'args': args
						},
						'secureContext':  $('select[name="membershipUser"]').val()			//use the user in select dropdown
					},
					'id': Date.now()
				};
	}
	
	//invoke 1 peer
	function rest_invoke_peer(func, args, cb){
		try{
			args = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = build_rest_body('invoke', func, args);
		var url = 'http://' + $('select[name="peer"]').val() + '/chaincode';
		recordRest('POST', url, data);
		logger.log('invoking func', func, data);
		
		$.ajax({
			method: 'POST',
			url: url,
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
		try{
			args = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = build_rest_body('query', func, args);
		var url = 'http://' + $('select[name="peer"]').val() + '/chaincode';
		recordRest('POST', url, data);
		logger.log('Querying func "' + func + '"', bag.ls.ccs[selectedCChash].details.peers[selectedPeerIndex].name, data);
		
		$.ajax({
			method: 'POST',
			url: url,
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
		try{
			args = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		var data = build_rest_body('query', func, args);														//secre context will be overwritten in loop

		for(var i in bag.ls.ccs[selectedCChash].details.peers){													//iter over all the peers
			var url = 'http://' + bag.ls.ccs[selectedCChash].details.peers[i].api_host + ':' + bag.ls.ccs[selectedCChash].details.peers[i].api_port + '/chaincode';
			recordRest('POST', url, data);
		
			data.params.secureContext = bag.ls.ccs[selectedCChash].details.peers[i].enrollID;					//get the right user for this peer
			logger.log('Querying func "' + func + '"', bag.ls.ccs[selectedCChash].details.peers[i].name, data);

			$.ajax({
				method: 'POST',
				url: url,
				data: JSON.stringify(data),
				peer_name: bag.ls.ccs[selectedCChash].details.peers[i].name,
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
	function rest_invoke_barebones(){
		var func = $('input[name="invoke_func_name"]').val();
		var args = $('input[name="invoke_func_val"]').val();
		try{
			args = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = build_rest_body('invoke', func, args);
		logger.log('Invoking Function "' + func + '"', data);
		
		$.ajax({
			method: 'POST',
			url: 'http://' + $('select[name="peer"]').val() + '/chaincode',
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
	
	//invoke barebones
	function rest_query_barebones(){
		var func = $('input[name="query_func_name"]').val();
		var args = $('input[name="query_func_val"]').val();
		try{
			args = try_to_parse(args);
		}
		catch(e){
			logger.log('Error - Input could not be stringified', e);
			return false;
		}
		
		var data = build_rest_body('query', func, args);
		logger.log('Querying Function "' + func + '"', data);

		$.ajax({
			method: 'POST',
			url: 'http://' + $('select[name="peer"]').val() + '/chaincode',
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
			data.deploy_arg = try_to_parse( $('input[name="deploy_arg"]').val());
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
				store_cc_to_ls(json);
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
	
	//play the recording - recursive!
	function rest_play_recording(recording, pos){
		var data = recording.story[pos].data;
		console.log('Playing back recording', recording, pos, data);
		logger.log('Playing back recording', data);

		$.ajax({
			method: recording.story[pos].method,
			url: recording.story[pos].url,
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				logger.log('Success', json);
				if(recording.story[++pos]) rest_play_recording(recording, pos);		//we must go deeper
				else stop_playback();
			},
			error: function(e){
				logger.log('Error', e);
				if(recording.story[++pos]) rest_play_recording(recording, pos);		//we must go deeper
				else stop_playback();
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
		$('.arginput').val('');
		
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
		$('.arginput').val('');
		$('.toolDisalbed').removeClass('toolDisalbed');
		
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
				if(bag.ls.ccs[selectedCChash].details.peers[selectedPeerIndex].enrollID == users[i].username) selected= 'selected="selected"';
				html += '<option ' + selected + '>' + users[i].username + '</option>';
			}
		}
		$('#users').html(html);
	}
	
	function toggle_panel(me){															//open/close the panel for this nav
		if($(me).hasClass('toolDisalbed')) {
			$('#loadPanelNav').css('border-color', '#cc0000');
			return false;
		}
		
		$('#loadPanelNav').css('border-color', '#555');
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

	//build html for recording icons
	function build_recordings(recordings){												//build parsed chaincode options
		var html = '';
		console.log('building recordings', recordings);
		for(var i in recordings){
			var text = '<input type="text" class="recordingName" value="' + recordings[i].name.substring(0, 8) +'" placeholder="name here">';
			var timestamp = Date.now();													//if no date, just make it today
			if(recordings[i].timestamp) timestamp = recordings[i].timestamp;
			text += '<br/>' + formatDate(timestamp, '%M/%d');
			text += '<br/>(' + recordings[i].story.length + ')';
		
			html += '<div class="testSummary" pos="' + i + '" title="' + recordings[i].name + '">';
			html += 		text;
			html +=		'<div class="delrecord fa fa-remove" title="remove test"></div>';
			html += '</div>';
		}
		$('#testsList').html(html);
	}
	
	
// ===============================================================================================================
// 												Helper Fun
// ===============================================================================================================
	function clearRecording(){
		console.log('clearing recording');
		recordedActions = {name: '', story: []};
	}
	
	//remember the http request for this recording
	function recordRest(method, url, data){
		if(bag.recording){
			recordedActions.story.push({method: method, url: url, data: data});
			$('#recordNumber').html(recordedActions.story.length);
			console.log('recorded actions', recordedActions);
		}
	}
	
	function hide_sdk_json_area(){
		$('#sdkInputWrap').hide();
		sizeMe($('#loadPanelNav'));
	}
	
	function load_from_ls(){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		
		if(window.localStorage) {
			var str = window.localStorage.getItem(lsKey);
			if(str){
				bag.ls = JSON.parse(str);
				console.log('local storage', bag.ls);
				return bag.ls;
			}
		}
	}
	
	function store_cc_to_ls(cc){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		if(!bag.ls.ccs) bag.ls.ccs = {};
					
		//load_from_ls();
		if(cc.details && cc.details.deployed_name){
			console.log('saving local storage');
			bag.ls.ccs[cc.details.deployed_name] = cc;									//store this cc
			window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save new one
		}
	}
	
	function store_recoding_to_ls(recording, pos){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		if(!bag.ls.ccs[selectedCChash].recordings) bag.ls.ccs[selectedCChash].recordings = [];
					
		if(recording.story.length > 0){
			console.log('saving new recording to local storage', recording);
			if(!isNaN(pos)) bag.ls.ccs[selectedCChash].recordings[pos] = recording;	//overwite recording
			else bag.ls.ccs[selectedCChash].recordings.push(recording);				//store new recording
			console.log('?', selectedCChash, bag.ls.ccs[selectedCChash].recordings);
			window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save new one
		}
	}
	
	function delete_from_ls(deployed_name){
		load_from_ls();
		if(bag.ls && bag.ls.ccs && deployed_name){
			console.log('removing', deployed_name);
			delete bag.ls.ccs[deployed_name];											//remove this cc
			window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save
		}
	}
	
	function delete_recording_from_ls(pos){
		load_from_ls();
		if(bag.ls.ccs && bag.ls.ccs[selectedCChash].recordings && bag.ls.ccs[selectedCChash].recordings[pos]){
			console.log('removing', pos);
			bag.ls.ccs[selectedCChash].recordings.splice(pos, 1);										//remove this cc
			window.localStorage.setItem(lsKey, JSON.stringify(bag.ls));					//save
		}
	}
});

function pretty_print(str){																//json pretty print if obj
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

/*things that should pass:
 null				- 0
 "test"				- 1st and 6th attempt
 test				- 3rd attempt
 9					- 1st and 5th attempt
 "9"				- 1st and 5th attempt
 true				- 1st and 5th attempt
 {"hi":"there"}		- 2nd attempt
 [0,9]				- 2nd attempt
 66, 77				- 2nd attempt
 abc, test			- 3rd attempt
 "test", "test"		- 2nd attempt
 "abc", 100			- 2nd attempt
 ["asdf", 9]		- 2nd attempt
*/

function try_to_parse(str){
	var ret = [];
	var i;
	
	if(str !== 'null'){
		
		// ------------- First Pass --------------- //
		try{
			var temp = JSON.parse(str.toString());					//try this one
			if(typeof temp !== 'object' ){
				ret = temp;											//only use this one for strings/numeric, skip array/obj
				console.log('1st attempt', ret);
			}
			else{
				throw 'keep looking';
			}
		}
		catch(e){
			try{
				ret = JSON.parse('[' + str.toString() + ']');		//now try this one
				console.log('2nd attempt', ret);
			}
			catch(e){												//last chanc bucko
				var subFields = str.split(',');
				for(var x in subFields) ret.push(subFields[x].trim());
				console.log('3rd attempt', ret);
			}
		}
		
		// ------------- Second Pass --------------- //
		if(ret.constructor !== Array){								//not done, make it an array
			try{
				if(typeof ret === 'object'){
					ret = JSON.stringify(ret);
					console.log('4th attempt', ret);
				}
				else{
					ret = JSON.parse('[' + ret.toString() + ']');	//now try this one
					console.log('5th attempt', ret);
				}
			}
			catch(e){
				ret = JSON.parse('["' + ret.toString() + '"]');		//last chance bucko
				console.log('6th attempt', ret);
			}
		}

		// ----------- String it Up ---------------- //
		for(i in ret){			
			if(typeof ret[i] === 'object'){
				ret[i] = JSON.stringify(ret[i]);
			}
			else{
				ret[i] = ret[i].toString();							//everything must be a string
			}
		}
	}
	
	if(ret.constructor !== Array){									//error out
		throw 'error could not make it into array of strings';
	}
	
	console.log('ret', ret);
	return ret;
}