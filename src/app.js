const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/ngo", require("./routes/ngo.routes"));
app.use("/api/need", require("./routes/need.routes"));
app.use("/api/donation", require("./routes/donation.routes"));

module.exports = app;
