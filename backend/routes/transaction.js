const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const router = express.Router();

// Create a new transaction
router.post("/", async (req, res) => {
  const { senderId, recipientId, amount } = req.body;

  try {
    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Find sender and recipient
    const sender = await User.findOne({ userId: senderId });
    const recipient = await User.findOne({ userId: recipientId });

    if (!sender || !recipient) {
      return res.status(404).json({ message: "Sender or recipient not found" });
    }

    // Check if sender has sufficient balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Create transaction record
    const transaction = new Transaction({
      senderId,
      recipientId,
      amount: amount || 0, // Ensure amount is defined
      status: "completed",
    });

    if (!amount) {
      console.error(
        `Transaction created with missing amount: ${transaction._id}`
      );
    }

    // Update balances
    sender.balance -= amount;
    recipient.balance += amount;

    // Save all changes
    await Promise.all([transaction.save(), sender.save(), recipient.save()]);

    res.status(201).json({
      transaction,
      senderBalance: sender.balance,
      recipientBalance: recipient.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rollback a transaction
router.post("/rollback/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Ensure only the sender or recipient can initiate a rollback
    if (
      transaction.recipientId !== req.body.userId &&
      transaction.senderId !== req.body.userId
    ) {
      return res.status(403).json({
        message: "Only the sender or recipient can rollback this transaction",
      });
    }

    // Find sender and recipient
    const sender = await User.findOne({ userId: transaction.senderId });
    const recipient = await User.findOne({ userId: transaction.recipientId });

    if (!sender || !recipient) {
      return res.status(404).json({ message: "Sender or recipient not found" });
    }

    // Reverse the transaction amounts
    sender.balance += transaction.amount;
    recipient.balance -= transaction.amount;

    // Update transaction status
    transaction.status = "failed";

    // Save all changes
    await Promise.all([transaction.save(), sender.save(), recipient.save()]);

    res.status(200).json({
      message: "Transaction rolled back successfully",
      senderBalance: sender.balance,
      recipientBalance: recipient.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Automatic rollback for failed transactions
const automaticRollback = async () => {
  const transactions = await Transaction.find({ status: "pending" });
  transactions.forEach(async (transaction) => {
    setTimeout(async () => {
      const sender = await User.findOne({ userId: transaction.senderId });
      const recipient = await User.findOne({ userId: transaction.recipientId });

      if (sender && recipient) {
        sender.balance += transaction.amount;
        recipient.balance -= transaction.amount;
        transaction.status = "failed";

        await Promise.all([
          transaction.save(),
          sender.save(),
          recipient.save(),
        ]);
        console.log(
          `Transaction ${transaction._id} rolled back automatically.`
        );
      }
    }, 60000); // Rollback after 1 minute
  });
};

// Call the automatic rollback function
automaticRollback();

// Get user transactions and balance
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and their transactions
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = await Transaction.find({
      $or: [{ senderId: userId }, { recipientId: userId }],
    }).sort({ timestamp: -1 }); // Sort by newest first

    res.status(200).json({
      currentBalance: user.balance,
      transactions: transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all transactions
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ timestamp: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
