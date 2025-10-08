import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

// --- CONFIGURATION ---
const contractAddress = "0x096F2C10B7b76379D99FC569A64B66FD05e10E0b"; 
const contractABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "donor", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "name": "DonationReceived", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "name": "Withdrawal", "type": "event" }, { "inputs": [], "name": "donorCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [ { "internalType": "address", "name": "", "type": "address" } ], "name": "donors", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "totalDonations", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "donate", "outputs": [], "stateMutability": "payable", "type": "function", "payable": true }, { "inputs": [ { "internalType": "address payable", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" } ], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getContractBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "getDonorCount", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function", "constant": true } ];

const App = () => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [totalDonations, setTotalDonations] = useState('0');
    const [contractBalance, setContractBalance] = useState('0');
    const [donorCount, setDonorCount] = useState(0);
    
    // Split history into two states for clarity
    const [donationHistory, setDonationHistory] = useState([]);
    const [withdrawalHistory, setWithdrawalHistory] = useState([]);

    const [formData, setFormData] = useState({
        donationAmount: '', donorName: '', donorMessage: '',
        withdrawAmount: '', withdrawAddress: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState('donate');
    const [theme, setTheme] = useState('light');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const fetchContractData = useCallback(async (currentContract) => {
        if (!currentContract) return;
        try {
            const total = await currentContract.totalDonations();
            const balance = await currentContract.getContractBalance();
            const count = await currentContract.getDonorCount();
            setTotalDonations(ethers.utils.formatEther(total));
            setContractBalance(ethers.utils.formatEther(balance));
            setDonorCount(count.toNumber());
        } catch (err) {
            console.error("❌ Error fetching smart contract data:", err);
            setError('Could not fetch data. Please follow the README troubleshooting steps.');
        }
    }, []);

    const fetchDonationHistory = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/donors');
            setDonationHistory(response.data);
        } catch (err) {
            console.error("❌ Error fetching donation history:", err);
            setError('Could not fetch transaction history. Is the backend server running?');
        }
    }, []);

    // NEW: Function to fetch withdrawal history
    const fetchWithdrawalHistory = useCallback(async () => {
        // This check is now inside the useEffect to ensure it runs with the latest admin status
        try {
            const response = await axios.get('http://localhost:5001/api/withdrawals');
            setWithdrawalHistory(response.data);
        } catch (err) {
            console.error("❌ Error fetching withdrawal history:", err);
        }
    }, []);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setTheme('dark');
        } else {
            document.documentElement.classList.remove('dark');
            setTheme('light');
        }

        const init = async () => {
            if (window.ethereum) {
                try {
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                    const web3Signer = web3Provider.getSigner();
                    const accounts = await web3Provider.send('eth_requestAccounts', []);
                    const donationContract = new ethers.Contract(contractAddress, contractABI, web3Signer);

                    setProvider(web3Provider);
                    setSigner(web3Signer);
                    setAccount(accounts[0]);
                    setContract(donationContract);
                    
                    const owner = await donationContract.owner();
                    const adminStatus = accounts[0].toLowerCase() === owner.toLowerCase();
                    setIsAdmin(adminStatus);

                    await fetchContractData(donationContract);
                    await fetchDonationHistory();
                    // Fetch withdrawal history only if the user is an admin
                    if (adminStatus) {
                        await fetchWithdrawalHistory();
                    }

                } catch (err) {
                    console.error("❌ Error during initialization:", err);
                    setError("Failed to initialize. Please connect to MetaMask and follow the README troubleshooting guide.");
                }
            } else {
                setError("MetaMask is not installed.");
            }
        };
        init();

        if(window.ethereum) {
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }, [fetchContractData, fetchDonationHistory, fetchWithdrawalHistory]);


    const handleDonate = async (e) => {
        e.preventDefault();
        const { donationAmount, donorName, donorMessage } = formData;
        if (!donationAmount || isNaN(donationAmount) || donationAmount <= 0 || !donorName) return setError("Please enter a valid name and donation amount.");
        if (!contract) return setError("Contract not initialized.");
        
        setLoading(true); setError(''); setSuccessMessage('');
        try {
            const tx = await contract.donate({ value: ethers.utils.parseEther(donationAmount), gasPrice: await provider.getGasPrice() });
            setSuccessMessage("Processing donation... waiting for confirmation.");
            const receipt = await tx.wait();

            await axios.post('http://localhost:5001/api/donors', {
                donorAddress: account, name: donorName, message: donorMessage, amount: donationAmount, transactionHash: receipt.transactionHash,
            });
            
            setSuccessMessage(`Donation successful! Thank you!`);
            setFormData(prev => ({ ...prev, donorName: '', donationAmount: '', donorMessage: ''}));
            await fetchContractData(contract);
            await fetchDonationHistory();
        } catch (err) {
            console.error("Donation Error:", err);
            setError(err.reason || "Transaction failed. Please reset your MetaMask account and try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e) => {
        e.preventDefault();
        const { withdrawAmount, withdrawAddress } = formData;
        if (!withdrawAmount || isNaN(withdrawAmount) || !ethers.utils.isAddress(withdrawAddress)) return setError("Please enter a valid amount and address.");
        if (!contract) return setError("Contract not initialized.");

        setLoading(true); setError(''); setSuccessMessage('');
        try {
            const amountInWei = ethers.utils.parseEther(withdrawAmount);
            const tx = await contract.withdraw(withdrawAddress, amountInWei, { gasPrice: await provider.getGasPrice() });
            setSuccessMessage("Processing withdrawal... waiting for confirmation.");
            const receipt = await tx.wait();
            
            // NEW: Post withdrawal data to backend
            await axios.post('http://localhost:5001/api/withdrawals', {
                recipientAddress: withdrawAddress,
                amount: withdrawAmount,
                transactionHash: receipt.transactionHash,
            });

            setSuccessMessage("Withdrawal successful!");
            setFormData(prev => ({...prev, withdrawAddress: '', withdrawAmount: ''}));
            await fetchContractData(contract);
            await fetchWithdrawalHistory(); // Refresh withdrawal history
            
        } catch (err) {
            console.error("Withdrawal Error:", err);
            setError(err.reason || "Withdrawal failed. Reset MetaMask and try again.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans transition-colors duration-300">
            <Header account={account} theme={theme} toggleTheme={toggleTheme} />
            <main className="container mx-auto p-4 md:p-8">
                {error && <Alert type="error">{error}</Alert>}
                {successMessage && <Alert type="success">{successMessage}</Alert>}
                
                <Stats totalDonations={totalDonations} donorCount={donorCount} contractBalance={contractBalance} />
                
                {/* Public View: Donation Form and History */}
                {!isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormCard title="Make Your Contribution">
                            <DonateForm {...{formData, handleInputChange, handleDonate, loading}} />
                        </FormCard>
                        <HistoryCard title="Live Donations" history={donationHistory} type="donation" />
                    </div>
                )}

                {/* Admin View: Dashboard */}
                {isAdmin && (
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
                        <h2 className="text-3xl font-bold text-center mb-6 text-red-500">Admin Dashboard</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <FormCard title="Withdraw Funds">
                                    <AdminPanel {...{formData, handleInputChange, handleWithdraw, loading}}/>
                                </FormCard>
                            </div>
                            <div className="lg:col-span-2 space-y-8">
                                <HistoryCard title="Donation History (All)" history={donationHistory} type="donation" />
                                <HistoryCard title="Withdrawal History" history={withdrawalHistory} type="withdrawal" />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- Helper & UI Components ---

const Alert = ({ type, children }) => {
    const baseClasses = "p-4 rounded-md mb-4 text-center";
    const typeClasses = type === 'error' 
        ? "bg-red-100 border border-red-400 text-red-700"
        : "bg-green-100 border border-green-400 text-green-700";
    return <div className={`${baseClasses} ${typeClasses}`} role="alert">{children}</div>
};

const Header = ({ account, theme, toggleTheme }) => (
    <header className="bg-white dark:bg-gray-800 shadow-lg p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-teal-500 dark:text-teal-400">🛡️ SecureAid</h1>
        <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {account && (
                <div className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full font-mono">
                    {account.slice(0, 6)}...{account.slice(-4)}
                </div>
            )}
        </div>
    </header>
);

const Stats = ({ totalDonations, donorCount, contractBalance }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Donations Raised" value={`${parseFloat(totalDonations).toFixed(4)} ETH`} color="text-teal-500 dark:text-teal-400" />
        <StatCard title="Total Unique Donors" value={donorCount} color="text-gray-800 dark:text-white" />
        <StatCard title="Current Contract Balance" value={`${parseFloat(contractBalance).toFixed(4)} ETH`} color="text-green-500 dark:text-green-400" />
    </div>
);

const StatCard = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-lg transition-transform hover:scale-105">
        <h3 className="text-lg text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
        <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </div>
);

const FormCard = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl h-full">
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
        {children}
    </div>
);

const HistoryCard = ({ title, history, type }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {history.length > 0 ? history.map((item) => (
                <HistoryItem key={item._id || item.transactionHash} item={item} type={type} />
            )) : <p className="text-center text-gray-400 py-4">No records yet.</p>}
        </div>
    </div>
);

const HistoryItem = ({ item, type }) => {
    const isDonation = type === 'donation';
    return (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
            <div className="flex justify-between items-center">
                <p className={`font-bold ${isDonation ? 'text-teal-500' : 'text-red-500'}`}>
                    {isDonation ? item.name : `${item.recipientAddress.slice(0,6)}...${item.recipientAddress.slice(-4)}`}
                </p>
                <p className={`font-bold ${isDonation ? 'text-green-500' : 'text-red-500'}`}>
                    {isDonation ? '+' : '-'} {item.amount} ETH
                </p>
            </div>
            {isDonation && <p className="text-sm text-gray-600 dark:text-gray-300 italic mt-1">"{item.message || 'No message'}"</p>}
            <div className="flex justify-between items-center mt-1 text-xs text-gray-400 dark:text-gray-500">
                <p className="font-mono">{isDonation ? `From: ${item.donorAddress.slice(0,10)}...` : `TX Hash: ${item.transactionHash.slice(0,10)}...`}</p>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const Input = ({ name, value, onChange, placeholder }) => (
    <input name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
);

const Textarea = ({ name, value, onChange, placeholder }) => (
    <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" rows="3"></textarea>
);

const DonateForm = ({ formData, handleInputChange, handleDonate, loading }) => (
    <form onSubmit={handleDonate} className="space-y-4">
        <Input name="donorName" value={formData.donorName} onChange={handleInputChange} placeholder="Your Name" />
        <Input name="donationAmount" value={formData.donationAmount} onChange={handleInputChange} placeholder="Amount in ETH (e.g., 0.1)" />
        <Textarea name="donorMessage" value={formData.donorMessage} onChange={handleInputChange} placeholder="Leave a message (optional)" />
        <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600">
            {loading ? 'Processing...' : 'Donate Now'}
        </button>
    </form>
);

const AdminPanel = ({ formData, handleInputChange, handleWithdraw, loading }) => (
    <form onSubmit={handleWithdraw} className="space-y-4">
        <Input name="withdrawAddress" value={formData.withdrawAddress} onChange={handleInputChange} placeholder="Recipient Address" />
        <Input name="withdrawAmount" value={formData.withdrawAmount} onChange={handleInputChange} placeholder="Amount in ETH" />
        <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600">
            {loading ? 'Processing...' : 'Withdraw Funds'}
        </button>
    </form>
);

export default App;











// import React, { useState, useEffect, useCallback } from 'react';
// import { ethers } from 'ethers';
// import axios from 'axios';

// // --- IMPORTANT CONFIGURATION ---
// // This is your working configuration.
// const contractAddress = "0x78DF59611e694495DF4859d1be817211Dc49dA72"; 
// const contractABI = [
//     {
//       "inputs": [],
//       "stateMutability": "nonpayable",
//       "type": "constructor"
//     },
//     {
//       "anonymous": false,
//       "inputs": [
//         {
//           "indexed": true,
//           "internalType": "address",
//           "name": "donor",
//           "type": "address"
//         },
//         {
//           "indexed": false,
//           "internalType": "uint256",
//           "name": "amount",
//           "type": "uint256"
//         },
//         {
//           "indexed": false,
//           "internalType": "uint256",
//           "name": "timestamp",
//           "type": "uint256"
//         }
//       ],
//       "name": "DonationReceived",
//       "type": "event"
//     },
//     {
//       "anonymous": false,
//       "inputs": [
//         {
//           "indexed": true,
//           "internalType": "address",
//           "name": "to",
//           "type": "address"
//         },
//         {
//           "indexed": false,
//           "internalType": "uint256",
//           "name": "amount",
//           "type": "uint256"
//         },
//         {
//           "indexed": false,
//           "internalType": "uint256",
//           "name": "timestamp",
//           "type": "uint256"
//         }
//       ],
//       "name": "Withdrawal",
//       "type": "event"
//     },
//     {
//       "inputs": [],
//       "name": "donorCount",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address",
//           "name": "",
//           "type": "address"
//         }
//       ],
//       "name": "donors",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     },
//     {
//       "inputs": [],
//       "name": "owner",
//       "outputs": [
//         {
//           "internalType": "address",
//           "name": "",
//           "type": "address"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     },
//     {
//       "inputs": [],
//       "name": "totalDonations",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     },
//     {
//       "inputs": [],
//       "name": "donate",
//       "outputs": [],
//       "stateMutability": "payable",
//       "type": "function",
//       "payable": true
//     },
//     {
//       "inputs": [
//         {
//           "internalType": "address payable",
//           "name": "_to",
//           "type": "address"
//         },
//         {
//           "internalType": "uint256",
//           "name": "_amount",
//           "type": "uint256"
//         }
//       ],
//       "name": "withdraw",
//       "outputs": [],
//       "stateMutability": "nonpayable",
//       "type": "function"
//     },
//     {
//       "inputs": [],
//       "name": "getContractBalance",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     },
//     {
//       "inputs": [],
//       "name": "getDonorCount",
//       "outputs": [
//         {
//           "internalType": "uint256",
//           "name": "",
//           "type": "uint256"
//         }
//       ],
//       "stateMutability": "view",
//       "type": "function",
//       "constant": true
//     }
//   ];
// // --- END CONFIGURATION ---

// const App = () => {
//     const [account, setAccount] = useState(null);
//     const [provider, setProvider] = useState(null);
//     const [signer, setSigner] = useState(null);
//     const [contract, setContract] = useState(null);
//     const [isAdmin, setIsAdmin] = useState(false);
//     const [totalDonations, setTotalDonations] = useState('0');
//     const [contractBalance, setContractBalance] = useState('0');
//     const [donorCount, setDonorCount] = useState(0);
//     const [donors, setDonors] = useState([]);
    
//     // FIX for single-character bug: All form fields are in one state object.
//     const [formData, setFormData] = useState({
//         donationAmount: '',
//         donorName: '',
//         donorMessage: '',
//         withdrawAmount: '',
//         withdrawAddress: ''
//     });

//     // UI State
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [activeTab, setActiveTab] = useState('donate');
//     // NEW: State for theme management
//     const [theme, setTheme] = useState('light');

//     // FIX for input fields: A single handler updates the formData state object.
//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };
    
//     // NEW: Function to toggle theme and save preference
//     const toggleTheme = () => {
//         const newTheme = theme === 'light' ? 'dark' : 'light';
//         setTheme(newTheme);
//         localStorage.setItem('theme', newTheme);
//         document.documentElement.classList.toggle('dark', newTheme === 'dark');
//     };

//     // --- Data Fetching and Initialization ---

//     const fetchContractData = useCallback(async (currentContract) => {
//         if (!currentContract) return;
//         try {
//             console.log("Attempting to fetch contract data...");
//             const total = await currentContract.totalDonations();
//             const balance = await currentContract.getContractBalance();
//             const count = await currentContract.getDonorCount();

//             setTotalDonations(ethers.utils.formatEther(total));
//             setContractBalance(ethers.utils.formatEther(balance));
//             setDonorCount(count.toNumber());
//             console.log("✅ Contract data fetched successfully.");
//             setError(''); 
//         } catch (err) {
//             console.error("❌ Error fetching smart contract data:", err);
//             setError('Could not fetch data. Please follow the README troubleshooting steps.');
//         }
//     }, []);

//     const fetchDonorsFromDB = useCallback(async () => {
//         try {
//             console.log("Attempting to fetch donor history from backend...");
//             const response = await axios.get('http://localhost:5001/api/donors');
//             setDonors(response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
//             console.log("✅ Donor history fetched successfully.");
//         } catch (err) {
//             console.error("❌ Error fetching donors from the database:", err);
//             setError('Could not fetch transaction history. Is the backend server running?');
//         }
//     }, []);

//     // This useEffect runs once on mount to initialize everything.
//     useEffect(() => {
//         // NEW: Set initial theme from localStorage or system preference
//         if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
//             document.documentElement.classList.add('dark');
//             setTheme('dark');
//         } else {
//             document.documentElement.classList.remove('dark');
//             setTheme('light');
//         }

//         const init = async () => {
//             setError('');
//             if (window.ethereum) {
//                 try {
//                     const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
//                     const web3Signer = web3Provider.getSigner();
//                     const accounts = await web3Provider.send('eth_requestAccounts', []);
                    
//                     const donationContract = new ethers.Contract(contractAddress, contractABI, web3Signer);

//                     setProvider(web3Provider);
//                     setSigner(web3Signer);
//                     setAccount(accounts[0]);
//                     setContract(donationContract);
                    
//                     const owner = await donationContract.owner();
//                     setIsAdmin(accounts[0].toLowerCase() === owner.toLowerCase());

//                     await fetchContractData(donationContract);
//                     await fetchDonorsFromDB();

//                 } catch (err) {
//                     console.error("❌ Error during initialization:", err);
//                     setError("Failed to initialize. Please connect to MetaMask and follow the README troubleshooting guide.");
//                 }
//             } else {
//                 setError("MetaMask is not installed. Please install it to use this dApp.");
//             }
//         };
        
//         init();

//         if(window.ethereum) {
//             window.ethereum.on('accountsChanged', () => window.location.reload());
//             window.ethereum.on('chainChanged', () => window.location.reload());
//         }
//     }, [fetchContractData, fetchDonorsFromDB]);

//     // --- Core Functions (Donation & Withdrawal) ---

//     const handleDonate = async (e) => {
//         e.preventDefault();
//         const { donationAmount, donorName, donorMessage } = formData;

//         if (!donationAmount || isNaN(donationAmount) || donationAmount <= 0 || !donorName) {
//             setError("Please enter a valid name and donation amount.");
//             return;
//         }
//         if (!contract || !signer || !provider) {
//             setError("Application not properly connected. Please refresh.");
//             return;
//         }

//         setLoading(true);
//         setError('');
//         setSuccessMessage('');

//         try {
//             const amountInWei = ethers.utils.parseEther(donationAmount);
//             const gasPrice = await provider.getGasPrice();
//             const tx = await contract.connect(signer).donate({ value: amountInWei, gasPrice: gasPrice });
            
//             setSuccessMessage("Processing donation... waiting for blockchain confirmation.");
//             const receipt = await tx.wait();

//             await axios.post('http://localhost:5001/api/donors', {
//                 donorAddress: account, name: donorName, message: donorMessage, amount: donationAmount, transactionHash: receipt.transactionHash,
//             });
            
//             setSuccessMessage(`Donation successful! Thank you! TX: ${receipt.transactionHash.slice(0, 6)}...${receipt.transactionHash.slice(-4)}`);
//             setFormData(prev => ({ ...prev, donorName: '', donationAmount: '', donorMessage: ''}));
            
//             await fetchContractData(contract);
//             await fetchDonorsFromDB();

//         } catch (err) {
//             console.error("Donation Error:", err);
//             // setError(err.reason || "Transaction failed. Please reset your MetaMask account (see README) and try again.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleWithdraw = async (e) => {
//         e.preventDefault();
//         const { withdrawAmount, withdrawAddress } = formData;
//         if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0 || !withdrawAddress) {
//             setError("Please enter a valid amount and address.");
//             return;
//         }
//         if (!ethers.utils.isAddress(withdrawAddress)) {
//             setError("Invalid recipient address.");
//             return;
//         }

//         setLoading(true);
//         setError('');
//         setSuccessMessage('');

//         try {
//             const amountInWei = ethers.utils.parseEther(withdrawAmount);
//             const gasPrice = await provider.getGasPrice();
//             const tx = await contract.connect(signer).withdraw(withdrawAddress, amountInWei, { gasPrice: gasPrice });

//             await tx.wait();
//             setSuccessMessage("Withdrawal successful!");
//             await fetchContractData(contract);
            
//         } catch (err) {
//             console.error("Withdrawal Error:", err);
//             setError(err.reason || "Withdrawal failed. Please reset your MetaMask account and try again.");
//         } finally {
//             setLoading(false);
//         }
//     };
    
//     // --- UI Components ---
//     return (
//         <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white min-h-screen font-sans transition-colors duration-300">
//             {/* Header with Theme Toggle */}
//             <header className="bg-white dark:bg-gray-800 shadow-lg p-4 flex justify-between items-center sticky top-0 z-10">
//                 <h1 className="text-2xl font-bold text-teal-500 dark:text-teal-400">🛡️ SecureAid</h1>
//                 <div className="flex items-center space-x-4">
//                     <button onClick={toggleTheme} className="text-2xl p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
//                         {theme === 'light' ? '🌙' : '☀️'}
//                     </button>
//                     {account && (
//                         <div className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
//                             Connected: {account.slice(0, 6)}...{account.slice(-4)}
//                         </div>
//                     )}
//                 </div>
//             </header>

//             <main className="container mx-auto p-4 md:p-8">
//                 {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4" role="alert">{error}</div>}
//                 {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-4" role="alert">{successMessage}</div>}
                
//                 {/* Stats */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//                     <StatCard title="Total Donations Raised" value={`${parseFloat(totalDonations).toFixed(4)} ETH`} color="text-teal-500 dark:text-teal-400" />
//                     <StatCard title="Total Unique Donors" value={donorCount} color="text-gray-800 dark:text-white" />
//                     <StatCard title="Current Contract Balance" value={`${parseFloat(contractBalance).toFixed(4)} ETH`} color="text-green-500 dark:text-green-400" />
//                 </div>
                
//                 {/* Tabs */}
//                 <div className="mb-8 flex justify-center border-b border-gray-200 dark:border-gray-700">
//                     <TabButton name="donate" activeTab={activeTab} setActiveTab={setActiveTab}>Donate</TabButton>
//                     {isAdmin && <TabButton name="admin" activeTab={activeTab} setActiveTab={setActiveTab}>Admin Panel</TabButton>}
//                 </div>

//                 {/* Forms */}
//                 <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl max-w-2xl mx-auto">
//                     {activeTab === 'donate' ? <DonateForm formData={formData} handleInputChange={handleInputChange} handleDonate={handleDonate} loading={loading} /> : null}
//                     {activeTab === 'admin' && isAdmin ? <AdminPanel formData={formData} handleInputChange={handleInputChange} handleWithdraw={handleWithdraw} loading={loading} /> : null}
//                 </div>
                
//                 {/* Transaction History */}
//                 <TransactionHistory donors={donors} />
//             </main>
//         </div>
//     );
// };

// // --- Helper Components ---

// const StatCard = ({ title, value, color }) => (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg text-center shadow-lg transition-transform hover:scale-105">
//         <h3 className="text-lg text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
//         <p className={`text-4xl font-bold ${color}`}>{value}</p>
//     </div>
// );

// const TabButton = ({ name, activeTab, setActiveTab, children }) => (
//     <button onClick={() => setActiveTab(name)} className={`px-6 py-3 font-semibold transition-colors duration-300 ${activeTab === name ? 'text-teal-500 border-b-2 border-teal-500' : 'text-gray-400 hover:text-teal-500'}`}>
//         {children}
//     </button>
// );

// const Input = ({ name, type = "text", value, onChange, placeholder }) => (
//     <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" required />
// );

// const Textarea = ({ name, value, onChange, placeholder }) => (
//     <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500" rows="3"></textarea>
// );

// const DonateForm = ({ formData, handleInputChange, handleDonate, loading }) => (
//     <form onSubmit={handleDonate} className="space-y-4">
//         <h2 className="text-xl font-bold text-center mb-4">Make Your Contribution</h2>
//         <Input name="donorName" value={formData.donorName} onChange={handleInputChange} placeholder="Your Name" />
//         <Input name="donationAmount" value={formData.donationAmount} onChange={handleInputChange} placeholder="Amount in ETH (e.g., 0.1)" />
//         <Textarea name="donorMessage" value={formData.donorMessage} onChange={handleInputChange} placeholder="Leave a message (optional)" />
//         <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600">
//             {loading ? 'Processing...' : 'Donate Now'}
//         </button>
//     </form>
// );

// const AdminPanel = ({ formData, handleInputChange, handleWithdraw, loading }) => (
//     <form onSubmit={handleWithdraw} className="space-y-4">
//         <h2 className="text-xl font-bold text-center text-red-500 mb-4">Admin Controls</h2>
//         <Input name="withdrawAddress" value={formData.withdrawAddress} onChange={handleInputChange} placeholder="Recipient Address" />
//         <Input name="withdrawAmount" value={formData.withdrawAmount} onChange={handleInputChange} placeholder="Amount in ETH" />
//         <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-400 dark:disabled:bg-gray-600">
//             {loading ? 'Processing...' : 'Withdraw Funds'}
//         </button>
//     </form>
// );

// const TransactionHistory = ({ donors }) => (
//     <div className="mt-12">
//         <h2 className="text-2xl font-bold text-center mb-6">Live Transaction History</h2>
//         <div className="max-w-4xl mx-auto space-y-4">
//             {donors.length > 0 ? donors.map((donor) => (
//                 <div key={donor._id || donor.transactionHash} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-start">
//                     <div>
//                         <p className="font-bold text-teal-500 dark:text-teal-400">{donor.name} <span className="text-gray-500 dark:text-gray-400 font-normal">donated</span> {donor.amount} ETH</p>
//                         <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">"{donor.message || 'No message'}"</p>
//                         <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-mono">From: {donor.donorAddress}</p>
//                     </div>
//                     <div className="text-right text-xs text-gray-400 dark:text-gray-500">
//                         {new Date(donor.timestamp).toLocaleString()}
//                         <a href={`https://etherscan.io/tx/${donor.transactionHash}`} target="_blank" rel="noopener noreferrer" className="block text-teal-500 hover:underline mt-1">View on Etherscan</a>
//                     </div>
//                 </div>
//             )) : (
//                 <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><p className="text-gray-400">No donations yet. Be the first!</p></div>
//             )}
//         </div>
//     </div>
// );

// export default App;

