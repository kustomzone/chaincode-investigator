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
	fmt.Println("invoke did not find func: " + function)					//error

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

This is done by using the shim function `stub.PutState`. 
The first argument is the key as a string, and the second argument is the value as an array of bytes.
This function may return an error which our code inspects and returns if present.

###Invoke
`Invoke` is called when you want to call chaincode functions to do real work. 
Invocation transactions will be captured as blocks on the chain. 
The structure of `Inovke` is simple. 
It recieves a `function` argument and based on this argument calls Go functions in the chaincode.

In our `chaincode.go` file lets change the `Invoke` function so that it calls a generic write function.

```
func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("invoke is running " + function)

	// Handle different functions
	if function == "init" {
		return t.Init(stub, "init", args)
	} else if function == "write" {
		return t.write(stub, args)
	}
	fmt.Println("invoke did not find func: " + function)

	return nil, errors.New("Received unknown function invocation")
}
```

Now that its looking for `write` lets make that function somehwere in our `chaincode.go` file.

```
func (t *SimpleChaincode) write(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name, value string
	var err error
	fmt.Println("running write()")

	if len(args) != 2 {
		return nil, errors.New("Incorrect number of arguments. Expecting 2. name of the variable and value to set")
	}

	name = args[0]                            //rename for funsies
	value = args[1]
	err = stub.PutState(name, []byte(value))  //write the variable into the chaincode state
	if err != nil {
		return nil, err
	}
	return nil, nil
}
```

This `write` function should look similar to `Init` change we just did. 
One major difference is that we can now set the key and value for `PutState`. 
This function will now let us store any key/value pair we want into the blockchaing ledger. 

###Query
As the name implies, Query is called whenever you query your chaincode state. 
Queries do not result in blocks being added to the chain. 
We can and will use Query to read the value of our chaincode state's key/value pairs. 

In our `chaincode.go` file lets change the `Query` function so that it calls a generic read function.

```
func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("query is running " + function)

	// Handle different functions
	if function == "read" {                            //read a variable
		return t.read(stub, args)
	}
	fmt.Println("query did not find func: " + function)

	return nil, errors.New("Received unknown function query")
}
```

Now that its looking for `read` lets make that function somehwere in our `chaincode.go` file.

```
func (t *SimpleChaincode) read(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
	var name, jsonResp string
	var err error

	if len(args) != 1 {
		return nil, errors.New("Incorrect number of arguments. Expecting name of the var to query")
	}

	name = args[0]
	valAsbytes, err := stub.GetState(name)
	if err != nil {
		jsonResp = "{\"Error\":\"Failed to get state for " + name + "\"}"
		return nil, errors.New(jsonResp)
	}

	return valAsbytes, nil
}
```

This `read` function is using the complement to `PutState` called `GetState`.
This shim function just takes 1 string argument. 
The argument is the name of the key to retrieve. 
Next this function returns the value as an array of bytes back to `Query` who in turn sends it back to the REST handler.

### Main
Finally, you need to create a short `main` function that will execute when each peer deploys their instance of the chaincode.
It just starts the chaincode and registers it with the peer. 
You don’t need to add any code here beyond what was already in the example code.

```
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
```

##Interacting with your chaincode
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




