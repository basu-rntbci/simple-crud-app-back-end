const express = require("express");
const mongoose = require("mongoose");
const productRoute = require("./routes/product.route");

const app = express();

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//routes
app.get("/", (req, res) => {
  res.send("Hello from Node JS");
});
app.use("/api/products", productRoute);

mongoose
  .connect(
    "mongodb+srv://rbk8118_db_user:xcVjmqbMf4RakzYv@backenddb.zybsn61.mongodb.net/?appName=BackendDB",
  )
  .then(() => {
    console.log("connected to DB");
    app.listen(3000, () => {
      console.log("Port is running on port 3000");
    });
  })
  .catch((error) => console.log("ERROR", error));
