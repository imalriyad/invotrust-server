const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// MiddleWare
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// varify token
const variyfiToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.tdf5wnd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("InvoTrustDb");
    const userCollection = database.collection("users");
    const depositCollection = database.collection("deposit");
    const withdrawCollection = database.collection("withdraw");
    const blogsCollection = database.collection("blogs");

    // api for get withdraw record
    app.get("/api/v1/get-withdraw-request", async (req, res) => {
      const result = await withdrawCollection.find().toArray();
      res.send(result);
    });

    // api for confirm withdraw
    app.patch("/api/v1/confirm-withdraw-request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const withdrawStatus = req.body;
      const updateFeild = {
        $set: {
          status: withdrawStatus.status,
        },
      };
      const result = await withdrawCollection.updateOne(filter, updateFeild);
      res.send(result);
    });

    // api for confirm deposit
    app.patch("/api/v1/confirm-deposit-request/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const depoStatus = req.body;
      const updateFeild = {
        $set: {
          status: depoStatus.status,
        },
      };
      const result = await depositCollection.updateOne(filter, updateFeild);
      res.send(result);
    });

    // api for get deposit record
    app.get("/api/v1/get-deposit-request", async (req, res) => {
      const result = await depositCollection.find().toArray();
      res.send(result);
    });

    // api for post Withdraw request
    app.post("/api/v1/create-withdraw", async (req, res) => {
      const newWithdraw = req.body;
      const result = await withdrawCollection.insertOne(newWithdraw);
      res.send(result);
    });
    // api for post deposit request
    app.post("/api/v1/create-deposit", async (req, res) => {
      const newDeposit = req.body;
      const result = await depositCollection.insertOne(newDeposit);
      res.send(result);
    });

    //  Api for getting userInfo
    app.get("/api/v1/get-user", variyfiToken, async (req, res) => {
      try {
        const user = req.query?.email;
        const cookeEmail = req.user?.email;
        if (user !== cookeEmail &&  cookeEmail !== process.env.ADMIN_MAIL) {
          return res.status(403).send({ message: "Forbidden" });
        }
        let query = {};
        if (user) {
          query = { email: user };
        }
        const options = {
          projection: { name: 1, email: 1, number: 1, refferLink: 1, _id: 0 },
        };
        const result = await userCollection.findOne(query, options)
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });

    // api for storing user data in database
    app.post("/api/v1/create-user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // api for blog
    app.get("/api/v1/blogs", async (req, res) => {
      try {
        const cursor = blogsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch {
        console.error("error");
      }
    });

    // api for jwt access token creating and storing
    app.post("/api/v1/auth/access-token", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    //api for clear cookie when user logout
    app.post("/api/v1/logout", (req, res) => {
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ status: true });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("InvoTrust server is running....");
});

app.listen(port, () => {
  console.log(`InvoTrust Server Running on port : ${port}`);
});
