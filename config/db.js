import mongoose from "mongoose";
import "dotenv/config"

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
};

export default connectDB;

/*


username: alphazero0130_db_user
password: N7cZw6IRydNKYJfZ




MONGO_URI=mongodb+srv://alphazero0130_db_user:N7cZw6IRydNKYJfZ@cluster1.ftoifrn.mongodb.net/salonDB?appName=Cluster1
PORT=3000
*/