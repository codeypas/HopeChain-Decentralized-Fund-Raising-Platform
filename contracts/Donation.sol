// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Donation {
    address public owner;
    mapping(address => uint256) public donors;
    mapping(address => bool) private hasDonated; // To track unique donors
    uint256 public totalDonations;
    uint256 public donorCount; // To store the count of unique donors

    event DonationReceived(address indexed donor, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed to, uint256 amount, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function donate() external payable {
        require(msg.value > 0, "Donation amount must be greater than zero.");
        
        // If this is the first time a user is donating, increment the unique donor count
        if (!hasDonated[msg.sender]) {
            hasDonated[msg.sender] = true;
            donorCount++;
        }

        donors[msg.sender] += msg.value;
        totalDonations += msg.value;
        emit DonationReceived(msg.sender, msg.value, block.timestamp);
    }

    function withdraw(address payable _to, uint256 _amount) external onlyOwner {
        require(_amount <= address(this).balance, "Insufficient funds.");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdrawal failed.");
        emit Withdrawal(_to, _amount, block.timestamp);
    }

    // --- Getter Functions ---

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // New function to get the unique donor count
    function getDonorCount() external view returns (uint256) {
        return donorCount;
    }
}

