const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const url = require('url')

const fs = require('fs');
const path = require('path');
require('dotenv/config');

mongoose.connect(process.env.MONGO_URL,
    { useNewUrlParser: true, useUnifiedTopology: true }, err => {
        console.log('connected')
    });

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, '/public')));

const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({ storage: storage });

const imgModel = require('./model');

app.get('/', (req, res) => {
    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            shuffleArray(items)
            res.render('carousel', { items: items });
        }
    });
});

app.get('/upload', (req, res) => {
    imgModel.findOne({name : req.query.name}, (err, item) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        }
        else {
            res.render('imageUploadForm', { item: item });
        }
    });
});

app.post('/upload', upload.single('image'), (req, res, next) => {
    const obj = {
        name: req.file.filename,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: `image/png`
        }
    }
    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect(url.format({
                pathname : '/upload/',
                query : {
                    "name" : obj.name
                }
            }));
        }
    });
});

const port = process.env.PORT || '3000'
app.listen(port, err => {
    if (err)
        throw err
    console.log('Server listening on port', port)
})

function shuffleArray(inputArray){
    inputArray.sort(()=> Math.random() - 0.5);
}