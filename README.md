
# 🛡️ SecureAid - A Decentralized Fundraising Platform

SecureAid is a full-stack decentralized application (dApp) that provides a secure and transparent platform for fundraising. It leverages the power of the Ethereum blockchain and smart contracts to ensure that all donations are immutable, trackable, and managed with the utmost integrity. The platform features a user-friendly interface for donors and a dedicated admin panel for monitoring and managing the funds.

---

## ✨ Features

- **Secure Donations via Smart Contracts:** All funds are handled by a Solidity smart contract, ensuring security and preventing unauthorized access.  
- **Real-time Fundraising Stats:** Dashboard displays total funds raised, contract balance, and number of unique donors in real-time.  
- **Live Transaction History:** Publicly viewable log of all donations for complete transparency.  
- **Admin Dashboard:** Contract owner can monitor and withdraw funds securely to verified wallets.  
- **Withdrawal Tracking:** Every withdrawal is recorded for a complete audit trail.  
- **MetaMask Integration:** Enables safe and easy user transactions.  
- **Dark & Light Mode:** Sleek UI with theme toggle for better accessibility.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|---------------|
| **Blockchain** | Solidity, Ganache, Truffle |
| **Frontend** | React.js, ethers.js, Tailwind CSS, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **Wallet** | MetaMask |

---

## 📂 Project Structure

```
secure-aid/
├── backend/
│   ├── .env                  # MongoDB connection string
│   ├── package.json
│   └── server.js             # Express API server
├── contracts/
│   ├── Donation.sol          # Main smart contract
│   └── Migrations.sol        # Truffle migration contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── index.js
│   │   └── index.css         # Tailwind CSS directives
│   ├── package.json
│   ├── craco.config.js
│   └── tailwind.config.js
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js # Deployment scripts
└── truffle-config.js         # Network & compiler config
```

---

## 🚀 Getting Started

### Prerequisites

Install the following:
- **Node.js** (v18+)
- **Ganache** (local Ethereum blockchain)
- **Truffle** → `npm install -g truffle`
- **MetaMask** (browser extension)
- **MongoDB** (local or Docker)

---

### Installation & Setup

#### 1️⃣ Clone the Repository
```bash
git clone https://github.com/codeypas/secure-aid 
cd secure-aid
```

#### 2️⃣ Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 3️⃣ Start Local Blockchain
1. Open **Ganache** → click “QUICKSTART”.
2. Keep it running in the background.

#### 4️⃣ Deploy the Smart Contract
```bash
cd ../
truffle migrate --network development --reset
```
Copy the deployed **contract address** displayed in the terminal.

#### 5️⃣ Configure Frontend
In `frontend/src/App.jsx`:
- Paste the contract address into `contractAddress`.
- Copy the **ABI** from `build/contracts/Donation.json` and assign it to `contractABI`.

#### 6️⃣ Configure and Run Backend
```bash
cd backend
touch .env
```
Add:
```
MONGO_URI=mongodb://localhost:27017/secureaid
```

Start MongoDB:
```bash
brew services start mongodb-community@7.0
```

Run the server:
```bash
node server.js
```

#### 7️⃣ Run the Frontend
```bash
cd ../frontend
npm start
```
Open: [http://localhost:3000](http://localhost:3000)

---

## 🧭 Usage

1. **Connect MetaMask:** Link your wallet (set to Ganache local network).  
2. **Import a Ganache Account:** Use a private key from Ganache to add test ETH.  
3. **Donate:** Fill in donation form → confirm via MetaMask pop-up.  
4. **Admin Panel:** Only visible to contract owner (first Ganache account).  

---

## ⚙️ Troubleshooting

| Issue | Solution |
|-------|-----------|
| **Transaction Failed (JSON-RPC Error)** | Reset MetaMask → Settings → Advanced → Reset Account |
| **Admin Panel Hidden** | Use the first Ganache account (deployment account) |
| **Transaction History Missing** | Ensure backend and MongoDB are both running |

---

## 📜 License
Feel free to use, modify, and distribute.

---

### 🌐 Connect & Contribute

📌 [GitHub Profile](https://github.com/codeypas)  
📧 Contact: bjbestintheworld@gmail.com  

Pull requests are welcome! For major changes, please open an issue first to discuss your idea.


---
### 🏆 Motto  
**“Build. Learn. Repeat.”**
---


⭐ **If you find this project helpful, give it a star on GitHub!**
