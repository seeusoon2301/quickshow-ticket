// import { MongoClient } from "mongodb";

// const uri =
//   "mongodb+srv://quickshow_db_user:ticket111@ticket.udwy4wi.mongodb.net/?retryWrites=true&w=majority";

// const eventData = {
//   name: "[CAT&MOUSE] Ca sĩ Jaykii và ca sĩ Đăng Khôi - Khi tình và nhạc giao thoa",
//   category: "music",
//   type: "trending",
//   place: "Cat&Mouse Live Music",
//   time: "20:00 - 23:00",
//   date: "2025-10-25",
//   tickets: [
//     { seatType: "VIP", price: 700000, currency: "VND", available: 50 },
//     { seatType: "Standard", price: 400000, currency: "VND", available: 100 },
//     { seatType: "Economy", price: 250000, currency: "VND", available: 200 }
//   ],
//   organizer: { name: "Cat&Mouse Live Music", contact: "contact@catmouse.vn" },
//   artists: ["Jaykii", "Đăng Khôi"],
//   image: "https://res.cloudinary.com/dop04mb3s/image/upload/v1761126982/tggbcixrnlqe33pvvxku.jpg",
//   createdAt: new Date()
// };


// // 🟢 Import dữ liệu
// async function importData() {
//   const client = new MongoClient(uri);
//   try {
//     await client.connect();
//     console.log("✅ Đã kết nối MongoDB thành công!");

//     const db = client.db("ticket");
//     const collection = db.collection("card-ticket");

//     // await collection.deleteMany({});
//     // console.log("🧹 Đã xoá dữ liệu cũ trong collection.");

//     const result = await collection.insertOne(eventData);
//     console.log(`✅ Đã import ${result.insertedCount} ảnh vào MongoDB.`);
//   } catch (error) {
//     console.error("❌ Lỗi import:", error.message);
//   } finally {
//     await client.close();
//     console.log("🔌 Đã ngắt kết nối MongoDB.");
//   }
// }

// // 🟠 Export dữ liệu
// async function getExportedData() {
//   const client = new MongoClient(uri);
//   await client.connect();
//   const db = client.db("ticket");
//   const collection = db.collection("card-ticket");
//   const docs = await collection.find({}).toArray();
//   await client.close();
//   return docs;
// }



// // 🔹 Gọi hàm mong muốn
//importData();
// //getExportedData();
// export const exportedData = await getExportedData();
// console.log(eventData);


import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import { ObjectId } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());
const PORT = 5000;

const uri =
  "mongodb+srv://quickshow_db_user:ticket111@ticket.udwy4wi.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function connectDB() {
  await client.connect();
  const db = client.db("ticket");
  const collection = db.collection("card-ticket");

  await collection.createIndex({ name: "text" }, { default_language: "none" });

  return collection;
}

let collection;
connectDB().then((c) => (collection = c));

app.get("/events", async (req, res) => {
  const { type, category, name } = req.query;

  try {
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (name) query.$text = { $search: name };

    const events = await collection.find(query).toArray();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const event = await collection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch event",
      details: err.message,
    });
  }
});

app.put("/events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tickets } = req.body;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { tickets } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await collection.findOne({ _id: new ObjectId(id) });
    res.json(updatedEvent);

  } catch (err) {
    res.status(500).json({
      error: "Update failed",
      details: err.message,
    });
  }
});


app.listen(PORT, () =>
  console.log(`Server đang chạy tại http://localhost:${PORT}`)
);

