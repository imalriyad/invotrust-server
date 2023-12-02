const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
const updateBalances = require("./updateBalances");
// MiddleWare
app.use(
  cors({
    origin: ["http://localhost:5173", "https://invotrusts.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Set a timeout to run the function at the next minute
setTimeout(() => {
  // Run the function every minute
  setInterval(() => {
    // Run the function now
    updateBalances();
    
  }, 60 * 1000); // 1 minute in milliseconds
});

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

    // api for updating user
    app.patch("/api/v1/update-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateFields = req.body;

      // Create a dynamic $set object based on available fields in req.body
      const $set = {};

      if (updateFields.hasOwnProperty("updatedTotalBalance")) {
        $set.totalBalance = updateFields.updatedTotalBalance;
      }

      if (updateFields.hasOwnProperty("updatedTotalSpent")) {
        $set.totalSpent = updateFields.updatedTotalSpent;
      }

      if (updateFields.hasOwnProperty("totalProfit")) {
        $set.totalProfit = updateFields.totalProfit;
      }

      if (updateFields.hasOwnProperty("totalReferral")) {
        $set.totalReferral = updateFields.totalReferral;
      }

      const updateUser = { $set };

      try {
        const result = await userCollection.updateOne(query, updateUser);
        res.send(result);
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    //  Api for getting userInfo as admin
    app.get("/api/v1/get-user-as-admin", async (req, res) => {
      try {
        const email = req.query?.email;
        let query = {};
        if (email) {
          query = { email: email };
        }

        const options = {
          projection: {
            name: 1,
            email: 1,
            number: 1,
            refferLink: 1,
            _id: 1,
            totalBalance: 1,
            totalProfit: 1,
            totalSpent: 1,
            totalReferral: 1,
          },
        };
        const result = await userCollection.find(query, options).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
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
        console.log('query mail',user,'cookie mail',cookeEmail);
        if (user !== cookeEmail && cookeEmail !== process.env.ADMIN_MAIL) {
          return res.status(403).send({ message: "Forbidden" });
        }
        let query = {};
        if (user) {
          query = { email: user };
        }
        const options = {
          projection: {
            name: 1,
            email: 1,
            number: 1,
            refferLink: 1,
            _id: 1,
            totalBalance: 1,
            totalProfit: 1,
            totalSpent: 1,
            totalReferral: 1,
          },
        };
        const result = await userCollection.findOne(query, options);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
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

    app.post("/api/v1/auth/access-token", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, {
        expiresIn: "30d", // Set the expiration time to 30 days
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set the cookie expiration time to 30 days
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

    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
