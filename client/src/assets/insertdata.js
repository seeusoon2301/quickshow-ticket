import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://quickshow_db_user:ticket111@ticket.udwy4wi.mongodb.net/?retryWrites=true&w=majority";

const eventData = {
  name: "[CAT&MOUSE] Ca sĩ Jaykii và ca sĩ Đăng Khôi - Khi tình và nhạc giao thoa",
  category: "other",
  type: "special",
  place: "Cat&Mouse Live Music",
  time: "20:00 - 23:00",
  date: "2025-10-20",
  price_set: 250000,
  tickets: [
    { seatType: "VIP", price: 700000, currency: "VND", available: 50 },
    { seatType: "Standard", price: 400000, currency: "VND", available: 100 },
    { seatType: "Economy", price: 250000, currency: "VND", available: 200 }
  ],
  image: "https://res.cloudinary.com/dop04mb3s/image/upload/v1761126982/tggbcixrnlqe33pvvxku.jpg",
  createdAt: new Date()
};


// // 🟢 Import dữ liệu
async function importData() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Đã kết nối MongoDB thành công!");

    const db = client.db("ticket");
    const collection = db.collection("card-ticket");

    //await collection.deleteMany({});
    // console.log("🧹 Đã xoá dữ liệu cũ trong collection.");

    const result = await collection.insertOne(eventData);
    // console.log(`✅ Đã import ${result.insertedCount} ảnh vào MongoDB.`);
  } catch (error) {
    console.error("❌ Lỗi import:", error.message);
  } finally {
    await client.close();
    console.log("🔌 Đã ngắt kết nối MongoDB.");
  }
}

importData();