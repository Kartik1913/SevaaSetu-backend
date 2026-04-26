const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/ngo", require("./routes/ngo.routes"));
app.use("/api/need", require("./routes/need.routes"));
app.use("/api/donation", require("./routes/donation.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/opportunity", require("./routes/opportunity.routes"));
app.use("/api/application", require("./routes/application.routes"));
app.use("/api/volunteer", require("./routes/volunteer.routes"));
app.use("/api/certificate", require("./routes/certificate.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));

module.exports = app;
