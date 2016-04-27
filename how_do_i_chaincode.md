#How to write Chaincode

##What is covered?
We will be building up to a working chaincode that will be able to create generic assets. 
Then we will show how to interact with the chaincode with Chaincode Investigator.

##What is chaincode?
Chaincode is a piece of code that lets you interact with a network's shared ledger.  Whenever you 'invoke' a transaction on the network, you are effectively calling a function in a piece of chaincode that read and writes values to the ledger.

[Insert a nice diagram from sean or something]

##What is Chaincode Investigator?
Chaincode Investigator or CCI is just a tool you can use to deploy/test your chaincode.  It will be used towards the end of this tutorial.

***

#Implementing Your First Chaincode

###Environment Setup
- Download and install GoLang for your OS - https://golang.org/dl/
- Add the hyperledger shim code to your Go path by opening a command prompt/terminal and type:
	
	```
	go get github.com/hyperledger/fabric/core/chaincode/shim
	```

##Github Setup
The Bluemix IBM Blockchain service currently requires chaincode to be in a [Github](https://github.com/) repositiory.
Therefore you should register a Github account and setup Git locally on your computer.
- Create a new repo for this project named `my_first_chaincode`
- Clone the repo to your local machine

###Starting Code
Copy and save the starting template code below to a new file: `my_first_chaincode/chaincode.go`

**Template Code**
```
package main

import (
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}

// Main
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

// Init - reset all the things
func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}

	return nil, nil
}

// Invoke - Our entry point
func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "init" {													//initialize the chaincode state, used as reset
		return t.Init(stub, "init", args)
	} else if function == "dummy_invoke" {									//deletes an entity from its state
		return t.dummy_invoke(stub, args)
	}
	fmt.Println("invoke did not find func: " + function)						//error

	return nil, errors.New("Received unknown function invocation")
}

// Query - Our entry point for Queries
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	if function == "dummy_query" {											//read a variable
		return t.dummy_query(stub, args)
	}
	fmt.Println("query did not find func: " + function)						//error

	return nil, errors.New("Received unknown function query")
}

// dummy_invoke - dummy invoke function
func (t *SimpleChaincode) dummy_invoke(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the var to query")
	}
	fmt.Println("test 1 function arg[0] has " + args[0])
	
	return nil, nil													//send it onward
}

// dummy_query - dummy query function
func (t *SimpleChaincode) dummy_query(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the var to query")
	}
	fmt.Println("test 2 function arg[0] has " + args[0])
	
	return nil, nil													//send it onward
}
```

###Dependencies
The `import` statement list a few dependencies that you will need for your chaincode to build successfully.
- The hyperledger shim.  This is the code that interfaces your golang code with a peer.

###Implementing the chaincode interface
First, implement the chaincode shim interface in your golang code.  The three functions are **Init**, **Invoke**, and **Query**. 
All three functions have the same prototype; they take in a function name and an array of strings. 
The difference between the functions is when they will be called. 
We will be building up to a working chaincode to create generic assets. 

###Init
Init is called when you first deploy your chaincode. 
As the name implies, this function should be used to do any initialization your chaincode needs. 
In our example, we use Init to configure the initial state of one variables on the ledger.

In our `chaincode.go` file lets change the `Init` function so that it stores the first element in the `args` argument to the key "hello_world".

**Init Code**
```
func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting 1")
	}
	
	err = stub.PutState("hello_world", []byte(args[0]))
	if err != nil {
		return nil, err
	}
	
	return nil, nil
}
```

This is done by using `stub.PutState`. The first argument is the key as a string, and the second argument is the value as an array of bytes.


###Invoke
Invoke is called when you invoke transactions on your chaincode.  Invocation transactions will actually be captured as blocks on the chain.  In the example, the invocation simply transfers a value between two given variables on the ledger.  The intent is that it be used to transfer between the variables that we created in Init.

[pre of Invoke function]

###Query
As the name implies, Query is called whenever you query your chaincode.  Queries do not result in blocks being added to the chain.  In our example, Query is used to check the value of a given variable.

[pre of Query function]

Finally, you need to create a short ‘main’ function that will execute when each peer deploys their instance of the chaincode.  It just starts the chaincode and registers it with the peer.  You don’t need to add any code here beyond what is in the example.

[pre of the ‘main’ function]
###Interacting with your chaincode
The fastest way to test your chaincode is to use the rest interface on your peers.  We’ve included a Swagger UI in the dashboard for your service instance that allows you to experiment with deploying chaincode without needing to write any additional code.

###Logging in
Calls to the /chaincode enpoint of the rest interface are secured.  This means that you must pass in a valid user_id from the service credentials in order for the deployment to be accepted.  The service credentials should already have an assortment of users to pick from:

[ screenshot of the user list from the credentials object]

Select one of the userID and secret pairs from your service’s credentials and sign them in using the /register endpoint.

[ screenshot of the /register endpoint in the swagger UI.  Have the information for the request filled in]

Now that we have logged a user, we can use this userID when deploying, invoking, and querying chaincode in the subsequent steps.

Deploying the chaincode
In order to deploy chaincode through the rest interface, you will need to have the chaincode stored in a public git repository.  When you send a deploy request to a peer, you send it the url to you chaincode repository, as well as the parameters necessary to initialize the chaincode. For example:

[pre of a deploy body]

[pre of a successful deploy response]

The response for the deployment will contain an ID that is associated with this chaincode.  This is how you will reference the chaincode in any future invoke or query requests.

Invoke
Next, we invoke a transaction on the chaincode.  This transaction will be a transfer between the two variable sthat we created in the initialization phase.  See below:

[pre’s of invoke body and response]

The response for the invoke is the ID that was generated for this transaction.
Query
Finally, let’s query the chaincode for the values of the two variables. For the first value:

[ pre’s of query body and response ]

... and for the second:

[pre’s of query body and reponse]

As you can see, the values have changed from what we initialized them to be.  If you don’t believe me, run the invoke again with different values and run the queries again.

Using the SDK
We already have pretty good documentation for getting started with the NodeJS SDK here.




