// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
let awsConfig = {
    "region": "ap-south-1",
    "accessKeyId": "AKIA6ODU6PC445Y3KXPA",
    "secretAccessKey": "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"
};
AWS.config.update(awsConfig);
// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({ apiVersion: "2012-08-10" });

var params = {
  TableName: "Store_Details",
  AttributeDefinitions: [
    {
      AttributeName: "store_name",
      AttributeType: "S",
    },
    {
      AttributeName: "root_user",
      AttributeType: "S",
    },
    {
      AttributeName: "root_password",
      AttributeType: "S",
    },
    {
        AttributeName: "list_of_accounts",
        AttributeType: "M",
    },
    {
      AttributeName: "list_of_branches",
        AttributeType: "L",
    },
    {
      AttributeName: "list_of_categories",
        AttributeType: "L",
    }
  ],
  KeySchema: [
    {
      AttributeName: "store_name",
      KeyType: "HASH",
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
  StreamSpecification: {
    StreamEnabled: false,
  },
};

// Call DynamoDB to create the table
ddb.createTable(params, function (err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Table Created", data);
  }
});
