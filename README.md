# Chaincode Investigator
This is a tool in the form of a web app to help test/develop chaincode. 
It is supposed to bridge the gap between developing your chaincode from scratch and having a working UI/app to test your chaincode. 
Simply create build-able chaincode and store it in GitHub. 
Then from this app deploy the cc to your IBM Blockchain network and get a UI to interact with your chaincode functions. 
Now you can invoke/query chacincode directly from this webapp. 

It also has the ability to record and remember query/invoke sequences.
This allows for rapid testing of a complex flow.

##Install
1. First up we need to install our dependencies. Open a command prompt/terminal and browse to the root of this project.
1. In the command prompt type:

	```
	> npm install
	> npm install gulp -g
	> gulp
	```
	
	(if gulp doesn't work, you can launch directly with `node app.js`)
	
1. If all goes well you should see this message in the console:
	
	```
	----------------------- Server Up - localhost:3001 -----------------------
	```
	
1. Open your favorite browser and go to [http://localhost:3001](http://localhost:3001)

***

**A full tutorial is coming soon!** 
Until then you can try my network/example below. 
This is a working format that you can past into the text area that appears when you click "Create Chaincode JSON Summary".

Of course you can modify it to fit your own network. 
You will find similar information about your own network from the service's Bluemix dashboard in the "Service Credentials" tab.

```
{
    "network": {
        "peers": [
            {
                "name": "vp1-95fb4294-d05...:443",
                "api_host": "95fb4294-d05a-4afa-bbcd-355c6d90d261_vp1-api.blockchain.ibm.com",
                "api_port": 80,
                "api_port_tls": 443,
                "id": "95fb4294-d05a-4afa-bbcd-355c6d90d261_vp1",
                "tls": true,
                "enrollID": "user_type1_fd818482a0",
                "api_url": "http://95fb4294-d05a-4afa-bbcd-355c6d90d261_vp1-api.blockchain.ibm.com:80"
            },
            {
                "name": "vp2-95fb4294-d05...:443",
                "api_host": "95fb4294-d05a-4afa-bbcd-355c6d90d261_vp2-api.blockchain.ibm.com",
                "api_port": 80,
                "api_port_tls": 443,
                "id": "95fb4294-d05a-4afa-bbcd-355c6d90d261_vp2",
                "tls": true,
                "enrollID": "user_type1_93c0c7bc9e",
                "api_url": "http://95fb4294-d05a-4afa-bbcd-355c6d90d261_vp2-api.blockchain.ibm.com:80"
            }
        ],
        "users": [
            {
                "username": "user_type1_fd818482a0",
                "secret": "d5d1a2cd27",
                "enrollId": "user_type1_fd818482a0",
                "enrollSecret": "d5d1a2cd27"
            },
            {
                "username": "user_type1_93c0c7bc9e",
                "secret": "7fcd7a2d53",
                "enrollId": "user_type1_93c0c7bc9e",
                "enrollSecret": "7fcd7a2d53"
            },
            {
                "username": "user_type1_3aa39ba81d",
                "secret": "82f211728e",
                "enrollId": "user_type1_3aa39ba81d",
                "enrollSecret": "82f211728e"
            },
            {
                "username": "user_type1_763a40ba66",
                "secret": "711761f28f",
                "enrollId": "user_type1_763a40ba66",
                "enrollSecret": "711761f28f"
            },
            {
                "username": "user_type1_bb6cd75403",
                "secret": "c2f111c2cd",
                "enrollId": "user_type1_bb6cd75403",
                "enrollSecret": "c2f111c2cd"
            }
        ]
    },
    "chaincode": {
        "zip_url": "https://github.com/ibm-blockchain/marbles-chaincode/archive/master.zip",
        "unzip_dir": "marbles-chaincode-master/hyperledger/part2",
        "git_url": "https://github.com/ibm-blockchain/marbles-chaincode/hyperledger/part2"
    }
}
```
		
### Deployment Tracking
Tracking numbers helps us gadge interest. Deployment tracking can be disabled by deleting the 'Deployment Tracking' section towards the bottom app.js.

## ToDos:
- [ ] CCI video
- [x] redesign CCI
- [x] move cci into its own repo
- [x] use the sdk to deploy
- [x] auto size nav
- [x] allow user to set what function he wants called in deploy
- [x] load spin when deploying
- [x] better naming of chaincode summary icons
- [x] clear button in log panel
- [x] ability to record api flows and save into local memory
- [x] move test/playback to under cc summary
- [x] naming/renaming recordings is akward
- [ ] rename cc summary, auto populates as is with cc repo name, but user can overide
- [x] add helpful UI hints for user error/success paths (highlight invalid inputs, buttons, valid buttons)
- [x] collaspe all on inital load, show logs when use executes chaincode
- [x] super input parser
- [x] sdk v1+ transition
- [x] hyperleder transition
- [x] create publc repo
- [ ] create detailed tutorial
- [x] cf tracking
- [ ] move tests out from under a single deployed chaincode, make them either global or maybe organize them under the same github repo
- [ ] ability to see peer and enrollID relations for all known enrollIDs
