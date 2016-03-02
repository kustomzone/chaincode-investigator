/* global bag */
var ledger = [];
var sel = 0;
var lsKey = 'cc_investigator';

$(document).ready(function(){
	// ===============================================================================================================
	// 												On Start Up
	// ================================================================================================================
	on_start();
	function on_start(){

		buildGoFunc(bag.cc.details);															//populate custom go functions panel
		if(bag && bag.cc && bag.cc.details) build_peer_options(bag.cc.details.peers);			//populate drop down peer select box
		//$("#jsonarea").html(JSON.stringify(bag.cc, null, 4));

		//localStorage.clear();
		//var obj = load_ls();
		//if(obj && obj.cc && obj.cc.names){
		//	build_cc(bag.cc);
		//}
		rest_get_cc_names();
	}
	
	function load_ls(){
		if(window.localStorage) {
			var str = window.localStorage.getItem(lsKey);
			var obj = {};
			if(str){
				obj = JSON.parse(str);
				//console.log('local storage', obj);
				return obj;
			}
		}
	}
	
	function store_cc_name(name){
		var str = window.localStorage.getItem(lsKey);
		var obj = {};
		if(!str){
			obj.cc = {names: []};
		}
		else{
			obj = JSON.parse(str);
		}
		
		if(name && !in_array(name, obj.cc.names)) obj.cc.names.push(name);			//only add if it doesn't exist yet
		window.localStorage.setItem(lsKey, JSON.stringify(obj));					//save new one
		//build_cc(obj.cc);
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
	
	$("#peers").change(function(){
		sel = $(this).val();
		console.log('Selected: ', bag.cc.details.peers[sel].api_host, bag.cc.details.peers[sel].api_port);
	});
	
	$("#delccname").click(function(){
		var obj = load_ls();
		var name = bag.cc.details.deployed_name;
		if(name && name.length > 1){
			for(var i in obj.cc.names){
				if(obj.cc.names[i] == name){
					console.log('removing', name);
					obj.cc.names.splice(i, 1);
					window.localStorage.setItem(lsKey, JSON.stringify(obj));
					
					//build_cc(obj.cc);
					break;
				}
			}
		}
	});
	
	$("#loadjson").click(function(){
		try{
			bag.cc = JSON.parse($("#jsonarea").val());
		}
		catch(e){
			console.log('Error, invalid json');
		}
		on_start();
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
	
	$(document).on("click", ".ccSummary", function(){
		var hash = $(this).attr("hash");
		console.log('Selected: ', hash);
		rest_get_cc(hash);
	});
	
	$(document).on("click", "#newcc", function(){
		if($("#newccWrap").is(":visible")){
			$("#newccWrap").fadeOut();
		}
		else{
			$("#newccWrap").fadeIn();
		}
	});
	
	$(document).on("click", "#customcc", function(){
		if($("#chaincodeDetailsWrap").is(":visible")){
			$("#chaincodeDetailsWrap").fadeOut();
		}
		else{
			$("#chaincodeDetailsWrap").fadeIn();
		}
	});
	
	$("#parsecc").click(function(){
		rest_parse_cc();
	});
	
	$(".tool").click(function(){
		if($(this).hasClass("toolClosed")){
			$(this).removeClass("toolClosed").addClass("toolOpen");
			$(this).find(".toollegendClosed").removeClass("toollegendClosed").addClass("toollegendOpen");
			$("#" + $(this).attr("show")).fadeIn().css("display","inline-block");
			$(this).find(".stepNumberClosed").removeClass("stepNumberClosed").addClass("stepNumberOpen");
		}
		else{
			$(this).removeClass("toolOpen").addClass("toolClosed");
			$(this).find(".toollegendOpen").removeClass("toollegendOpen").addClass("toollegendClosed");
			$("#" + $(this).attr("show")).hide();
			$(this).find(".stepNumberOpen").removeClass("stepNumberOpen").addClass("stepNumberClosed");
		}
	});
	
	
	// ===============================================================================================================
	// 												HTTP Functions
	// ================================================================================================================
	function rest_read(name, lvl, cb){
		console.log("reading var", name);
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
				console.log('Success - read', JSON.stringify(json));
				if(cb) cb(null, json);
			},
			error: function(e){
				console.log('Error - read', e);
				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_write(name, value, cb){
		console.log("writing var", name);
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
				console.log('Success - write', json);
				if(cb) cb(null, json);
			},
			error: function(e){
				console.log('Error - write', e);
				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_deploy(cb){
		console.log("deploying chaincode");
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
		console.log(data);
		
		$.ajax({
			method: 'POST',
			url: 'http://' + host + ':' + port + '/devops/deploy',
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: function(json){
				console.log('Success - deploy (you should still wait for go)', json);

				if(cb) setTimeout(function(){ cb(null, json); }, 60000);
			},
			error: function(e){
				console.log('Error - deploy', e);

				if(cb) cb(e, null);
			}
		});
	}
	
	function rest_read_all_peers(name, lvl, cb){
		console.log("reading var", name);
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
		
		for(var i in bag.cc.details.peers){
			$.ajax({
				method: 'POST',
				url: 'http://' + bag.cc.details.peers[i].api_host + ':' + bag.cc.details.peers[i].api_port + '/devops/query',
				data: JSON.stringify(data),
				peer_name: bag.cc.details.peers[i].name,
				contentType: 'application/json',
				success: function(json){
					console.log('Success - read all', this.peer_name, JSON.stringify(json));
					if(cb) cb(null, json);
				},
				error: function(e){
					console.log('Error - read all', this.peer_name, e);
					if(cb) cb(e, null);
				}
			});
		}
	}
	
	function rest_remove(){
		console.log("removing");
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
				console.log('Success - remove', json);
			},
			error: function(e){
				console.log('Error - remove', e);
			}
		});
	}
	
	function rest_init(){
		console.log("init");
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
				console.log('Success - init', json);
			},
			error: function(e){
				console.log('Error - init', e);
			}
		});
	}
	
	function rest_barebones(){
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
				console.log('Success', json);
			},
			error: function(e){
				console.log('Error', e);
			}
		});
	}
	
	function rest_get_cc_names(){
		//console.log("getting cc summary files");
		$.ajax({
			method: 'GET',
			url: 'http://' + bag.setup.SERVER.EXTURI + '/cc/summary',
			contentType: 'application/json',
			success: function(json){
				console.log('Success - get cc summaries');
				build_cc(json);
			},
			error: function(e){
				console.log('Error - get cc summaries', e);
			}
		});
	}
	
	function rest_get_cc(hash){
		//console.log("getting a cc summary file");
		$.ajax({
			method: 'GET',
			url: 'http://' + bag.setup.SERVER.EXTURI + '/cc/summary/' + hash,
			contentType: 'application/json',
			success: function(json){
				console.log('Success - get a cc summary');
				bag.cc = json;
				$("#jsonarea").html(JSON.stringify(json, null, 4));
				on_start();
			},
			error: function(e){
				console.log('Error - get cc summary', e);
			}
		});
	}
	
	function rest_parse_cc(){
		//console.log("getting a cc summary file");
		
	}
	
	
	// ===============================================================================================================
	// 												Build UI Fun
	// ================================================================================================================
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
	
	function build_cc(names){														//chaincode select options
		var html = '';
		for(var i in names){
			var css_sel = '';
			if(bag.cc.details && names[i].indexOf(bag.cc.details.deployed_name) >= 0) css_sel = 'sel';
			html += '<div class="ccSummary ' + css_sel + '" hash="' + names[i] +'">' + names[i].substring(0, 3) + '</div>';
		}
		html += '<span class="fa fa-plus" id="newcc"></span>';
		html += '<span class="fa fa-gear" id="customcc"></span>';
		$("#chaincodes").html(html);
	}
	
	function build_peer_options(peers){														//peer select options
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
});