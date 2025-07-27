const mongoose = require('mongoose');

// mongoose 8 설정
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn("MONGO_URI가 설정되지 않았습니다. MongoDB 연결을 건너뜁니다.");
      return;
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB 연결 성공");
  } catch (error) {
    console.error("MongoDB 연결 실패", error);
    console.warn("MongoDB 없이 서버를 계속 실행합니다.");
  }
};

module.exports = connectDB;