const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user"),
    fs = require('fs'),
    path = require('path'),
    url = require('url')

require('dotenv/config')

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_URL,
    {useNewUrlParser: true, useUnifiedTopology: true}, err => {
        console.log('connected')
    });


const app = express();
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())

app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));


const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({storage: storage});

const imgModel = require('./models/image');


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//=====================
// ROUTES
//=====================

// Showing home page
app.get('/', (req, res) => {
    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            shuffleArray(items)
            res.render('carousel', {items: items, title: 'Accueil', isConnected: req.isAuthenticated()});
        }
    });
});


// Showing secret page
app.get('/upload', isLoggedIn, (req, res) => {
    imgModel.findOne({name: req.query.name}, (err, item) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            res.render('imageUploadForm', {item: item, title: "Ajout d'image", isConnected: req.isAuthenticated()});
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
        } else {
            res.redirect(url.format({
                pathname: '/upload',
                query: {
                    "name": obj.name
                }
            }));
        }
    });
});


// Handling user signup
async function admin() {

    const username = 'admin'
    const password = 'admin'


    if (await User.exists({username: username})) {
        console.log("User : admin, already exist in database")

    } else {
        console.log("We are creating user: admin")
        User.register(new User({username: username}),
            password, function (err, user) {
                if (err) {
                    console.log(err);

                }
            });
    }
}

//Showing login form
app.get("/login", function (req, res) {
    res.render("login", {title: "Connexion"});
});

//Handling user login
app.post("/login", passport.authenticate("local", {
    successRedirect: "/upload",
    failureRedirect: "/login"
}), function (req, res) {
});

//Handling user logout
app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});

function shuffleArray(inputArray) {
    inputArray.sort(() => Math.random() - 0.5);
}

admin()