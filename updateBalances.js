const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const mongoURI = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.tdf5wnd.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(mongoURI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function updateBalances() {
  try {
    // await client.connect();
    // console.log("Connected to MongoDB");

    const database = client.db("InvoTrustDb");
    const userCollection = database.collection("users");

    const users = await userCollection.find().toArray();

    for (const user of users) {
      const baseAmount = user.totalBalance;

      if (baseAmount >= 20) {
        const percentage = 0.04;
        user.totalProfit += baseAmount * percentage;
        user.totalBalance *= 1 + percentage;
      } else if (baseAmount >= 10) {
        const percentage = 0.035;
        user.totalProfit += baseAmount * percentage;
        user.totalBalance *= 1 + percentage;
      } else {
        const percentage = 0.03;
        user.totalProfit += baseAmount * percentage;
        user.totalBalance *= 1 + percentage;
      }

      // Update the document in the collection
      await userCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            totalProfit: user.totalProfit,
            totalBalance: user.totalBalance,
          },
        }
      );
    }

    console.log("Balances updated successfully");
  } finally {
    // await client.close();
    // console.log("Disconnected from MongoDB");
  }
}

module.exports = updateBalances;
