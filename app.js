// Creating all constants for all dependencies necessary
const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    imgModel = require('./models/image'),
    User = require("./models/user"),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    multer = require('multer');
    const app = express();

// Loading new env variables
require('dotenv/config')


// Connection to database with env variables

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect(process.env.MONGO_URL,
    {useNewUrlParser: true, useUnifiedTopology: true}, err => {
        console.log('connected')
    });



// Using "ejs" as view engine
app.set("view engine", "ejs");

// Setting up folder for static files (such as css files)
app.use(express.static(path.join(__dirname, '/public')));



// Parsing JSON object 
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json())



// Middleware for cooking session
app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

// Setting storage of uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({storage: storage});



// middleware for authentication, Initialization of passport !
app.use(passport.initialize());
app.use(passport.session());

// Creation d'une session pour l'utilisateur
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Starting server
const port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
});

//=======//
// ROUTES//
//=======//

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

// Showing upload page only when logged in
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

// Called when image is uploaded
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


//Showing login form
app.get("/login", function (req, res) {
    res.render("login", {title: "Connexion", isConnected: req.isAuthenticated()});
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

// Function that if logged in, make it so that the server may proceed with what's next
// but if not logged in, redirects to login page
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}

// Randomize array of pictures
function shuffleArray(inputArray) {
    inputArray.sort(() => Math.random() - 0.5);
}

// Function to create an admin in database if it's not already present
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

admin()