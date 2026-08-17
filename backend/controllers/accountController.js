import accountModel from "../models/accountModel.js";
import transferModel from "../models/transferModel.js";

export async function addAccount(req, res) {
  const userId = req.user._id;
  const { bankName, accountType, balance } = req.body;

  try {
    if (!bankName || !accountType || balance === undefined) {
      return res.status(400).json({
        success: false,
        message: "Bank name, account type, and balance are required",
      });
    }

    const account = new accountModel({
      userId,
      bankName,
      accountType,
      balance,
    });
    await account.save();

    res.json({
      success: true,
      message: "Account added successfully!",
      data: account,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function getAllAccounts(req, res) {
  try {
    const accounts = await accountModel
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(accounts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function updateAccount(req, res) {
  const { id } = req.params;
  const { bankName, accountType, balance } = req.body;
  const updates = {};

  if (bankName !== undefined) updates.bankName = bankName;
  if (accountType !== undefined) updates.accountType = accountType;
  if (balance !== undefined) updates.balance = balance;

  try {
    const account = await accountModel.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.json({
      success: true,
      message: "Account updated successfully",
      data: account,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteAccount(req, res) {
  try {
    const account = await accountModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function transferBetweenAccounts(req, res) {
  const userId = req.user._id;
  const { fromAccountId, toAccountId, amount, date, status } = req.body;
  const transferAmount = Number(amount);

  try {
    if (!fromAccountId || !toAccountId || !transferAmount || !date) {
      return res.status(400).json({
        success: false,
        message: "From account, to account, amount, and date are required",
      });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({
        success: false,
        message: "Choose two different accounts for a transfer",
      });
    }

    const [fromAccount, toAccount] = await Promise.all([
      accountModel.findOne({ _id: fromAccountId, userId }),
      accountModel.findOne({ _id: toAccountId, userId }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    if (fromAccount.balance < transferAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in the source account",
      });
    }

    fromAccount.balance = Number(fromAccount.balance) - transferAmount;
    toAccount.balance = Number(toAccount.balance) + transferAmount;

    await Promise.all([fromAccount.save(), toAccount.save()]);

    const transfer = new transferModel({
      userId,
      description: `${fromAccount.bankName} to ${toAccount.bankName}`,
      amount: transferAmount,
      date: new Date(date),
      status: status || "Completed",
    });
    await transfer.save();

    res.json({
      success: true,
      message: "Account transfer completed successfully",
      data: {
        fromAccount,
        toAccount,
        transfer,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
