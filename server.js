const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv=require('dotenv').config();
const app = express();
const port = 5000;

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors())

// Set up AWS credentials and region
AWS.config.update({
    region: 'ap-south-1',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

// Create DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient();
app.use(bodyParser.json());
// Define route for GET request to /
app.get("/", (req, res) => {
    console.log("Hello World");
    res.sendStatus(200);
});

// Define route for GET request to /getStoreDetails
app.get("/getStoreDetails", (req, res) => {
    const params = {
        TableName: 'Store_Details'
    };
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            res.status(500).json({ error: 'Unable to scan the table' });
        } else {
            console.log('Scan succeeded.');
            res.json(data.Items);
        }
    });
});
app.post("/addCategory",(req,res)=>{
  const {newCategoryName,newIconLink}=req.body;
  const newCategory={
    "name":newCategoryName,
    "icon_url":newIconLink
  }
  const params={
    TableName:"Store_Details",
    Key:{
      store_name:'Hapree',
      root_user:'hapree'
    }
  }
  docClient.get(params,(err,data)=>{
    if(err){
      console.error("Unable to read item. Error Json: ",JSON.stringify(err,null,2));
      res.send(500).json({error:"Unable to read item from dynamoDB"});
    }
    else{
      const listOfCategories=data.Item?data.Item.list_of_categories||[]:[];
      let maxCategoryId=0;
      for(let i=0;i<listOfCategories.length;i++){
        const category=listOfCategories[i];
        maxCategoryId=Math.max(maxCategoryId,category.id);
      }
      newCategory.id=maxCategoryId;
      listOfCategories.push(newCategory);
      const updateParams = {
        TableName: 'Store_Details',
        Key: {
            store_name: 'Hapree',
            root_user: 'hapree'
        },
        UpdateExpression: 'set list_of_categories = :categories',
        ExpressionAttributeValues: {
            ':categories': listOfCategories
        },
        ReturnValues: 'UPDATED_NEW'
    };
    docClient.update(updateParams, (err, data) => {
      if (err) {
          console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
          res.status(500).json({ error: 'Unable to update item in DynamoDB' });
      } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2));
          res.status(200).json({ message: 'Category added successfully' });
      }
  });
    }
  })


})


//Now what modification has to be made is to add products to respective branches in stores!
app.post("/addProductDetails",(req,res)=>{
  const {name,category,quantity,price,selectedValues}=req.body;
  const quantityValue=quantity?quantity:1;
  const newProduct={
    "category_name": category,
    "price":price,
    "product_name":name,
    "quantity":quantityValue
  }
  console.log(newProduct);
  const params={    
      TableName:'Store_Details',
      Key:{
        store_name:'Hapree',
        root_user:'hapree'
      }
  }
  docClient.get(params,(err,data)=>{
    if(err){
      console.error("Unable to read item.Error Json:",JSON.stringify(err,null,2));
      res.status(500).json({error:"Unable to read item from dynamoDb"});
    }
    else{
      const listOfProducts=data.Item?data.Item.list_of_products||[]:[];
      let maxProductId=0;
      for(let i=0;i<listOfProducts.length;i++){
        const product=listOfProducts[i];
        const product_id=product.product_id;
        maxProductId=Math.max(maxProductId,product_id);
      }
      newProduct.product_id = maxProductId + 1;
      listOfProducts.push(newProduct);
      const updateParams = {
        TableName: 'Store_Details',
        Key: {
            store_name: 'Hapree',
            root_user: 'hapree'
        },
        UpdateExpression: 'set list_of_products = :products',
        ExpressionAttributeValues: {
            ':products': listOfProducts
        },
        ReturnValues: 'UPDATED_NEW'
    };
    docClient.update(updateParams, (err, data) => {
      if (err) {
          console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
          res.status(500).json({ error: 'Unable to update item in DynamoDB' });
      } else {
          console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2));
          res.status(200).json({ message: 'Product added successfully' });
      }
  });

    }
  })

})
//delete based on productid(first get list of pfoducts and then filter right?)
//or use expressions in params,getindex, and delete directly from product list
app.delete("/deleteProduct/:productIndex",(req,res)=>{
  const indexToDelete=req.params.productIndex;
  console.log(indexToDelete);
  const params={
    TableName:"Store_Details",
    Key:{
      store_name:"Hapree",
      root_user:'hapree'
    },
    UpdateExpression:'REMOVE list_of_products[' + indexToDelete + ']',
    ConditionExpression:'attribute_exists(list_of_products['+indexToDelete+'])',
    ReturnValues:'ALL_OLD'
  }
  docClient.update(params, (err, data) => {
    console.log(params.UpdateExpression);
    if (err) {
        console.error('Unable to delete item. Error JSON:', JSON.stringify(err, null, 2));
        res.status(500).json({ error: 'Unable to delete item from DynamoDB' });
    } else {
        console.log('DeleteItem succeeded:', JSON.stringify(data, null, 2));
        res.status(200).json({ message: 'Product deleted successfully' });
    }
});
})

app.get("/getCategories", async (req, res) => {
  try {
    const params = {
      TableName: "Store_Details",
      KeyConditionExpression: "store_name = :storeName",
      ExpressionAttributeValues: {
        ":storeName": "Hapree"
      }
    };

    const data = await docClient.query(params).promise();
    console.log(data);
    console.log("Categories query succeeded");
    res.json(data.Items[0].list_of_categories);
  } catch (error) {
    console.error("Error retrieving categories", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getCommonCategories", async (req, res) => {
  try {
    const params = {
      TableName: "Common_Categories",
    };

    const data = await docClient.scan(params).promise();
    console.log(data);
    console.log("Categories query succeeded");
    res.json(data.Items);
  } catch (error) {
    console.error("Error retrieving categories", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/getBranchesInStore",(req,res)=>{
  const params={
    TableName:"Store_Details",
    KeyConditionExpression: "store_name = :storeName",
    ExpressionAttributeValues: {
        ":storeName": "Hapree"
    }
  }
  docClient.query(params,(err,data)=>{
    if(err){
      console.error("Error retrieving branches",JSON.stringify(err,null,2));
      res.status(500).json({error:"Internal server error"});
    }
    else{
      console.log(data);
      console.log("Categories query succeeded");
      res.status(200).json(data.Items[0].list_of_branches);
    }
  })

})
app.get("/getNumberOfBranches",(req,res)=>{
  const params={
    TableName:"Store_Details",
    KeyConditionExpression: "store_name = :storeName",
    ExpressionAttributeValues: {
        ":storeName": "Hapree"
    }
  }
  docClient.query(params,(err,data)=>{
    if(err){
      console.error("Error fetching number of branches",JSON.stringify(err,null,2));
      res.send(500).json({error:"Internal server error"});
    }
    else{
      console.log(data);
      res.send(200).json(data);
    }
  })
})
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
