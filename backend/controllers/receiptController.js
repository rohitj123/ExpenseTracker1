import receiptModel from "../models/receiptModel.js";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const parseFileData = (fileData) => {
  const match = String(fileData).match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
};

export async function addReceipt(req, res) {
  const userId = req.user._id;
  const { title, expenseName, amount, fileName, fileData } = req.body;

  try {
    if (!title || !expenseName || amount === undefined || !fileName || !fileData) {
      return res.status(400).json({
        success: false,
        message: "Title, expense name, amount, and receipt file are required",
      });
    }

    const parsedFile = parseFileData(fileData);

    if (!parsedFile || !SUPPORTED_TYPES.includes(parsedFile.mimeType)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, and PDF receipts are supported",
      });
    }

    const receipt = new receiptModel({
      userId,
      title,
      expenseName,
      amount,
      fileName,
      mimeType: parsedFile.mimeType,
      fileData: parsedFile.base64,
    });
    await receipt.save();

    res.json({
      success: true,
      message: "Receipt uploaded successfully!",
      data: {
        ...receipt.toObject(),
        fileData: undefined,
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

export async function getAllReceipts(req, res) {
  try {
    const receipts = await receiptModel
      .find({ userId: req.user._id })
      .select("-fileData")
      .sort({ createdAt: -1 });

    res.json(receipts);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function downloadReceipt(req, res) {
  try {
    const receipt = await receiptModel.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const buffer = Buffer.from(receipt.fileData, "base64");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${receipt.fileName}"`
    );
    res.setHeader("Content-Type", receipt.mimeType);
    res.send(buffer);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function deleteReceipt(req, res) {
  try {
    const receipt = await receiptModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    res.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}
