const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// --- Mongoose Schemas and Models ---
const donorSchema = new mongoose.Schema({
    donorAddress: { type: String, required: true },
    name: { type: String, required: true },
    message: { type: String },
    amount: { type: Number, required: true },
    transactionHash: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now }
});
const Donor = mongoose.model('Donor', donorSchema);

// NEW: Schema for withdrawal records
const withdrawalSchema = new mongoose.Schema({
    recipientAddress: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionHash: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now }
});
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

// --- MongoDB Connection ---
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('CRITICAL: MONGO_URI is not defined in your .env file.');
        process.exit(1);
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected successfully.');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};
connectDB();

// --- API Routes ---

// GET all donor records (Donation History)
app.get('/api/donors', async (req, res) => {
    try {
        const donors = await Donor.find().sort({ timestamp: -1 });
        res.json(donors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching donors', error: error.message });
    }
});

// POST a new donor record
app.post('/api/donors', async (req, res) => {
    try {
        const newDonor = new Donor(req.body);
        const savedDonor = await newDonor.save();
        res.status(201).json(savedDonor);
    } catch (error) {
        res.status(500).json({ message: 'Error saving donor', error: error.message });
    }
});

// NEW: GET all withdrawal records (Withdrawal History)
app.get('/api/withdrawals', async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find().sort({ timestamp: -1 });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching withdrawals', error: error.message });
    }
});

// NEW: POST a new withdrawal record
app.post('/api/withdrawals', async (req, res) => {
    try {
        const newWithdrawal = new Withdrawal(req.body);
        const savedWithdrawal = await newWithdrawal.save();
        res.status(201).json(savedWithdrawal);
    } catch (error) {
        res.status(500).json({ message: 'Error saving withdrawal', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});










// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// // Make sure dotenv is installed: npm install dotenv
// require('dotenv').config(); 

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // --- Mongoose Schema ---
// const donorSchema = new mongoose.Schema({
//     donorAddress: { type: String, required: true },
//     name: { type: String, required: true },
//     message: { type: String },
//     amount: { type: Number, required: true },
//     transactionHash: { type: String, required: true, unique: true },
//     timestamp: { type: Date, default: Date.now }
// });
// const Donor = mongoose.model('Donor', donorSchema);

// // --- MongoDB Connection ---
// const connectDB = async () => {
//     const mongoURI = process.env.MONGO_URI;

//     if (!mongoURI) {
//         console.error('CRITICAL: MONGO_URI is not defined in your .env file.');
//         process.exit(1);
//     }
    
//     // DEBUGGING STEP: This will print the exact URI being used.
//     console.log(`Attempting to connect to MongoDB at: ${mongoURI}`);

//     try {
//         await mongoose.connect(mongoURI);
//         console.log('✅ MongoDB connected successfully.');
//     } catch (err) {
//         console.error('❌ MongoDB connection error:', err.message);
//         console.error('CRITICAL: The backend server cannot connect to MongoDB. Please ensure your database is running.');
//         process.exit(1);
//     }
// };
// connectDB();

// // --- API Routes ---
// app.get('/api/donors', async (req, res) => {
//     try {
//         const donors = await Donor.find().sort({ timestamp: -1 });
//         res.json(donors);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching donors from database', error: error.message });
//     }
// });

// app.post('/api/donors', async (req, res) => {
//     const { donorAddress, name, message, amount, transactionHash } = req.body;
//     try {
//         const newDonor = new Donor({ donorAddress, name, message, amount, transactionHash });
//         const savedDonor = await newDonor.save();
//         res.status(201).json(savedDonor);
//     } catch (error) {
//         res.status(500).json({ message: 'Error saving donor metadata', error: error.message });
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });





// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // --- MongoDB Connection ---
// mongoose.connect(process.env.MONGO_URI)
//     .then(() => console.log('MongoDB connected successfully.'))
//     .catch(err => console.error('MongoDB connection error:', err));

// // --- Mongoose Schema and Model ---
// const donorSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true },
//     walletAddress: { type: String, required: true },
//     amount: { type: Number, required: true }, // Storing amount in ETH
//     transactionHash: { type: String, required: true, unique: true },
//     timestamp: { type: Date, default: Date.now }
// });

// const Donor = mongoose.model('Donor', donorSchema);

// // --- API Routes ---
// app.get('/', (req, res) => {
//     res.send('SecureAid Backend is running.');
// });

// // GET all donor metadata
// app.get('/api/donors', async (req, res) => {
//     try {
//         const donors = await Donor.find().sort({ timestamp: -1 });
//         res.json(donors);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching donors', error });
//     }
// });

// // POST new donor metadata after successful transaction
// app.post('/api/donors', async (req, res) => {
//     const { name, email, walletAddress, amount, transactionHash } = req.body;

//     if (!name || !walletAddress || !amount || !transactionHash) {
//         return res.status(400).json({ message: 'Missing required fields.' });
//     }

//     const newDonor = new Donor({
//         name,
//         email,
//         walletAddress,
//         amount,
//         transactionHash
//     });

//     try {
//         const savedDonor = await newDonor.save();
//         res.status(201).json(savedDonor);
//     } catch (error) {
//          if (error.code === 11000) { // Handle duplicate transaction hash
//             return res.status(409).json({ message: 'This transaction has already been recorded.' });
//         }
//         res.status(500).json({ message: 'Error saving donor metadata', error });
//     }
// });


// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
