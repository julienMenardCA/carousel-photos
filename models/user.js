const mongoose = require("mongoose");

const passportlocalmongoose = require("passport-local-mongoose");
const UserSchema = mongoose.Schema({
    username: String,
    Password: String
});

UserSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model("User", UserSchema);