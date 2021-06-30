const mongoose = require("mongoose");
const URI = "mongodb://localhost:27017/carousel";

mongoose.connect(URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Carousel = mongoose.model("Carousel",{

    forename: String,
    surname: String
})

