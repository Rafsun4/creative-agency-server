const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()


const port = 5000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@volunteer-network-clust.1khvz.mongodb.net/creative-agency?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const orderDetailsCollection = client.db("creative-agency").collection("orderDetails");
    const reviewCollection = client.db("creative-agency").collection("reviews");
    const adminCollection = client.db("creative-agency").collection("admin");
    const serviceCollection = client.db("creative-agency").collection("serviceList");

    //Add Order by Client
    app.post('/placeOrder', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const task = req.body.task;
    const status = req.body.status;
    const productDetails = req.body.productDetails;
    const price = req.body.price;

    //image 
    const newImg = file.data;
    const encImg = newImg.toString('base64');
    const image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    orderDetailsCollection.insertOne({ name, email, task, productDetails, price, image, status })
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    });

    //all orders for admins
    app.get('/orders', (req, res) => {
        orderDetailsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    //Show Orders to client's order page
    app.get('/orders', (req, res) => {
        const email = req.body.email;
        orderDetailsCollection.find({ email: email })
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    // update order
    app.patch('/orderUpdate/:id', (req, res) => {
        orderDetailsCollection.updateOne({ _id: ObjectId(req.params.id) }, {
            $set: { status: req.body.status },
        })
        .then((result, err) => {
                res.send(result.modifiedCount > 0, err)
        })
    })

    
    //add review by client
    app.post('/addReview', (req, res) => {
    const image = req.body.image;
    const name = req.body.name;
    const companyname = req.body.companyname;
    const description = req.body.description;

    reviewCollection.insertOne({ name, companyname, description, image })
        .then((result) => {
            res.send(result.insertedCount > 0);
        })
    })

 
    //All Reviews together in home page
    app.get('/allReview', (req, res) => {
    reviewCollection.find({})
        .toArray((err, documents) => {
            res.send(documents);
        })
    })


    //service collection API
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;

        const encImg = file.data.toString('base64');

        const image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        serviceCollection.insertOne({ name, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
            .catch(err => res.send({ msg: "error" }))
    });


    //All Service Collection
        app.get('/allServices',(req, res)=>{
        serviceCollection.find({})
        .toArray((err,documents)=>{
            res.send(documents);
        })
    })

    //make admin
    app.post('/addAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.insertOne({ email })
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    //get admin
    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, documents) => {
                if (documents.length > 0) {
                    res.send(true);
                } else {
                    res.send(false);
                }
            })
    })

    app.get('/isAdmin', (req, res) => {
        adminCollection.find({})
            .toArray((err, documents) => {
                if (documents.length > 0) {
                    res.send(documents);
                } else {
                    res.send(false);
                }
            })
    })

})

app.get('/', (req, res) => {
    res.send('Database is working!!!')
})


app.listen(process.env.Port || port)
