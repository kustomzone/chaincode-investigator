/* global $ */
/* global in_array */
/* global bag */
var ledger = [];
var sel = 0;
var lsKey = 'cc_investigator';

$(document).ready(function(){
	// ===============================================================================================================
	// 												On Start Up
	// ================================================================================================================
	sizeMe($("#logPanelNav"));
	lets_do_this();
	//localStorage.clear();
	
	function lets_do_this(){
		load_from_ls();
		build_ccs(bag.ls);
		if(bag && bag.cc && bag.cc.details) {
			buildGoFunc(bag.cc.details);														//populate custom go functions panel
			build_peer_options(bag.cc.details.peers);											//populate drop down peer select box
			build_user_options(bag.cc.details.users);
			
			$("#peer").html(bag.cc.details.peers[sel].name);									//populate status panel
			$("#name").html(bag.cc.details.deployed_name.substring(0,32) + '...');
		}
	}
	
	// ===============================================================================================================
	// 												jQuery Events
	// ================================================================================================================
	$(document).on("click", ".runButton", function(){
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var func = $(this).attr('func').toLowerCase();
		var args = $(this).prev().val();
		
		var temp = '';
		try{
			temp = JSON.parse("[" + args + "]");
		}
		catch(e){
			console.log('ERROR you done messed up - body was not vaild json');
			return false;
		}
		
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": func,
								"args": temp
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};
		
		console.log("invoking func", func, data);
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				console.log('Success', json);
			},
			error: function(e){
				console.log('Error', e);
			}
		});
	});
	
	$("#read").click(function(){
		rest_read($("input[name='read_name']").val());
	});
	
	$("#readall").click(function(){
		rest_read_all_peers($("input[name='read_name']").val());
	});
	
	$("#write").click(function(){
		rest_write($("input[name='write_name']").val(), $("input[name='write_val']").val());
	});
	
	$("#deploy").click(function(){
		rest_deploy(cb_wait);
		
		function cb_wait(e, json){
			console.log('go - deploy timer finished', json);
		}
	});
	
	$(document).on("click", ".delcc", function(){
		delete_from_ls($(this).parent().attr('hash'));
		console.log('deleted cc');
		bag.cc = {};
		lets_do_this();
		return false;
	});
	
	$("#peers").change(function(){
		sel = $(this).val();
		$("#peer").html(bag.cc.details.peers[sel].name);								//populate status panel
		build_user_options(bag.cc.details.users);
		console.log('Selected peer: ', bag.cc.details.peers[sel].api_host, bag.cc.details.peers[sel].api_port);
	});
	
	$("#loadjson").click(function(){
		try{
			bag.cc = JSON.parse($("#jsonarea").val());
		}
		catch(e){
			console.log('Error, invalid json');
			return;
		}
		store_to_ls(bag.cc);
		lets_do_this();
		$("#chaincodeDetailsWrap").fadeOut();
	});
	
	
	$("#barebones").click(function(){
		rest_barebones();
	});
	
	$("#remove").click(function(){
		rest_remove();
	});
	
	$("#init").click(function(){
		rest_init();
	});
	
	$(document).on("click", ".ccSummary", function(){								//load the selected cc
		var hash = $(this).attr("hash");
		console.log('Selected cc: ', hash);
		for(var i in bag.ls){
			if(i == hash){
				bag.cc = bag.ls[i];
				lets_do_this();
				$("#jsonarea").html(JSON.stringify(bag.cc, null, 4));
				
				if(!$("#jsonarea").is(":visible")){
					//$(this).addClass("selectedCC");
					setTimeout(function(){
						toggle_panel($("#loadPanelNav"));
						show($("#chaincodePanelNav"));
					}, 300);
				}
				break;
			}
		}
	});
	
	$(document).on("click", "#loadManual", function(){
		if($("#newccWrap").is(":visible")){
			$("#newccWrap").fadeOut();
		}
		else{
			$("#newccWrap").fadeIn();
		}
		
		sizeMe($("#loadPanelNav"));
	});
	
	$(document).on("click", "#loadText", function(){
		if($("#chaincodeDetailsWrap").is(":visible")){
			$("#chaincodeDetailsWrap").fadeOut();
		}
		else{
			$("#jsonarea").html('copy paste here!');
			$("#chaincodeDetailsWrap").fadeIn();
		}
		
		sizeMe($("#loadPanelNav"));
	});
	
	$("#parsecc").click(function(){

	});
	
	$(".tool").click(function(){
		toggle_panel(this);
	});
	
	function toggle_panel(me){
		if($(me).hasClass("toolClosed")){
			show(me);
		}
		else{
			$(me).removeClass("toolOpen").addClass("toolClosed");
			$(me).find(".toollegendOpen").removeClass("toollegendOpen").addClass("toollegendClosed");
			$("#" + $(me).attr("show")).hide();
			$(me).find(".stepNumberOpen").removeClass("stepNumberOpen").addClass("stepNumberClosed");
			
			$(me).css('height', 'initial').css('line-height', 'initial');
		}
	}
	
	function show(me){
		$(me).removeClass("toolClosed").addClass("toolOpen");
		$(me).find(".toollegendClosed").removeClass("toollegendClosed").addClass("toollegendOpen");
		$("#" + $(me).attr("show")).fadeIn().css("display","inline-block");
		$(me).find(".stepNumberClosed").removeClass("stepNumberClosed").addClass("stepNumberOpen");
	
		sizeMe(me);
	}
	
	function sizeMe(me){
		var height = $("#" + $(me).attr("show")).css('height');
		//var pos = height.indexOf('px');
		//height = height.substring(0, pos) - 20 + 'px';
		$(me).css('height', height).css('line-height', height);
	}
	
	
	// ===============================================================================================================
	// 												HTTP Functions
	// ================================================================================================================
	function rest_read(name, lvl, cb){
		log.log("Reading var", name);
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": "query",
								"args": [name]
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};
		//console.log(data);
		
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/query',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success - read', JSON.stringify(json));
				if(cb) cb(null, json);
			},
			error: function(e){
				log.log('Error - read', e);
				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_write(name, value, cb){
		log.log("Writing var", name);
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": "write",
								"args": [name, value]
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success - write', json);
				if(cb) cb(null, json);
			},
			error: function(e){
				log.log('Error - write', e);
				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_deploy(cb){
		log.log("Deploying chaincode");
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var data = 	{
						type: "GOLANG",
						chaincodeID: {
							path: bag.cc.details.git_url
						},
						ctorMsg: {
							function: "init",
							"args": JSON.parse("[" + $("input[name='init_args']").val() + "]")
						},
						"secureContext": bag.cc.details.peers[sel].user
					};
		//console.log(data);
		
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/deploy',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success - deploy (you should still wait for go)', json);
				if(cb) setTimeout(function(){ cb(null, json); }, 60000);
			},
			error: function(e){
				log.log('Error - deploy', e);

				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_read_all_peers(name, lvl, cb){
		log.log("Reading var", name);
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": "query",
								"args": [name]
							},
							"secureContext": 'set later'										//set this in the loop
						}
					};
		//console.log(data);
		
		for(var i in bag.cc.details.peers){
			data.chaincodeSpec.secureContext = bag.cc.details.peers[i].user;					//get the right user for this peer
			$.ajax({
				method: 'POST',
				url: 'http://' + bag.cc.details.peers[i].api_host + ':' + bag.cc.details.peers[i].api_port + '/devops/query',
				data: JSON.stringify(data),
				peer_name: bag.cc.details.peers[i].name,
				contentType: 'application/json',
				success: function(json){
					log.log('Success - read all', this.peer_name, JSON.stringify(json));
					if(cb) cb(null, json);
				},
				error: function(e){
					log.log('Error - read all', this.peer_name, e);
					if(cb) cb(e, null);
				}
			});
		}
	}
	
	function rest_remove(){
		log.log("Removing");
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;				
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": 'delete',
								"args": [$("input[name='remove_name']").val()]
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};

		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success - remove', json);
			},
			error: function(e){
				log.log('Error - remove', e);
			}
		});
	}
	
	function rest_init(){
		log.log("init");
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": "init",
								"args": [name]
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};
		
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success - init', json);
			},
			error: function(e){
				log.log('Error - init', e);
			}
		});
	}
	
	function rest_barebones(){
		log.log("custom", $("input[name='func_name']").val());
		var host = bag.cc.details.peers[sel].api_host;
		var port = bag.cc.details.peers[sel].api_port;
		var data = {
						"chaincodeSpec": {
							"type": "GOLANG",
							"chaincodeID": {
								name: bag.cc.details.deployed_name,
							},
							"ctorMsg": {
								"function": $("input[name='func_name']").val(),
								"args": JSON.parse($("input[name='func_val']").val())
							},
							"secureContext": bag.cc.details.peers[sel].user
						}
					};

		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/invoke',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				log.log('Success', json);
			},
			error: function(e){
				log.log('Error', e);
			}
		});
	}
	
	// ===============================================================================================================
	// 												Build UI Fun
	// ===============================================================================================================
	function buildGoFunc(cc){
		var skip = ['write', 'read', 'delete', 'init'];
		var html = '';
		var field = '<input class="arginput" type="text" placeholder="array of strings"/>';
		if(cc && cc.func){
			for(var i in cc.func){
				if(!in_array(cc.func[i].toLowerCase(), skip)){
					html += '<div class="func">' + cc.func[i] + '([ ' + field + ']);';
						html += '<button type="button" class="runButton" func="' + cc.func[i] + '"> Run <span class="fa fa-fire"></span> </button>&nbsp;&nbsp;';
					html += '</div>';
				}
			}
			$("#customgowrap").html(html);
			$("#giturl").html(cc.git_url);
		}
	}
	
	function build_ccs(ccs){																	//chaincode select options
		var html = '';
		//console.log('building cc', ccs);
		for(var i in ccs){
			if(ccs[i].details){
				html += '<div class="ccSummary" hash="' + ccs[i].details.deployed_name +'">';
				html += 		ccs[i].details.deployed_name.substring(0, 3);
				html +=		'<div class="delcc fa fa-remove"></div>';
				html += '</div>';
			}
		}
		$("#chaincodes").html(html);
	}
	
	function build_peer_options(peers){															//peer select options
		if(peers){
			peers.sort(function(a, b) {															//alpha sort me
				var textA = a.id.toUpperCase();
				var textB = b.id.toUpperCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});
			var html = '';
			for(var i in peers){
				html += '<option value="' + i +'">' + peers[i].name + '</option>';
			}
			$("#peers").html(html);
		}
	}
	
	function build_user_options(users){															//user select options
		var html  = '';
		html += '<option>' + bag.cc.details.peers[sel].user + '</option>';
		
		if(users){
			users.sort(function(a, b) {															//alpha sort me
				var textA = a.username.toUpperCase();
				var textB = b.username.toUpperCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});

			for(var i in users){
				html += '<option>' + users[i].username + '</option>';
			}
		}
		$("#users").html(html);
	}
	
	
// ===============================================================================================================
// 												Helper Fun
// ===============================================================================================================
	function load_from_ls(){
		if(window.localStorage) {
			var str = window.localStorage.getItem(lsKey);
			if(str){
				bag.ls = JSON.parse(str);
				//console.log('local storage', bag.ls);
				return bag.ls;
			}
		}
	}
	
	function store_to_ls(cc){
		if(!bag) bag = {};
		if(!bag.ls) bag.ls = {};
		
		load_from_ls();
		if(cc.details && cc.details.deployed_name){
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


function pretty_print(str){
	if(str.constructor === Object || str.constructor === Array){
		return JSON.stringify(str, null, 4);
	}
	else{
		return str + " ";
	}
}

var log = 	{
				log: function log(str1, str2, str3){
					if(str1 && str2 && str3) console.log(str1, str2, str3);		//stupid print
					else if(str1 && str2) console.log(str1, str2);
					else console.log(str1);
					
					$("#logs").append("\n");
					if(str1) $("#logs").append(pretty_print(str1));
					if(str2) $("#logs").append(pretty_print(str2));
					if(str3) $("#logs").append(pretty_print(str3));
			}
};