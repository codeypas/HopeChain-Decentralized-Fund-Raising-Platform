const Donation = artifacts.require("Donation");

/*
 * The contract() function is a Truffle specific function that works like
 * the describe() function in Mocha. It provides a clean room environment
 * for each test, meaning the contract is redeployed before each test.
 */
contract("Donation", (accounts) => {
  let donationInstance;

  // Before each test, get a new instance of the contract
  beforeEach(async () => {
    donationInstance = await Donation.deployed();
  });

  // Test case 1: Check if the contract deploys successfully
  it("should deploy the contract correctly", async () => {
    assert(donationInstance.address !== "", "Contract should have an address.");
  });

  // Test case 2: Check if the owner is the first account from Ganache
  it("should have the correct owner", async () => {
    const owner = await donationInstance.owner();
    assert.equal(owner, accounts[0], "The owner is not the first account.");
  });

  // Test case 3: Check if a user can make a donation
  it("should allow a user to make a donation", async () => {
    const donor = accounts[1]; // Use the second account as the donor
    const donationAmount = web3.utils.toWei("1", "ether"); // 1 ETH in wei

    // Perform the donation
    await donationInstance.donate({ from: donor, value: donationAmount });

    // Check the contract balance
    const contractBalance = await web3.eth.getBalance(donationInstance.address);
    assert.equal(contractBalance, donationAmount, "The contract balance is incorrect.");

    // Check the donor's balance in the contract's mapping
    const donorBalance = await donationInstance.donors(donor);
    assert.equal(donorBalance.toString(), donationAmount, "The donor's balance was not recorded correctly.");
  });

});
