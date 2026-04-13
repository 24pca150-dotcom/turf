import chalk from "chalk";
import User from "../../models/user.model.js";

export const updateBankDetails = async (req, res) => {
    const userId = req.user.user;
    const { upiId, accountNumber, ifsc, holderName } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.bankDetails = {
            upiId,
            accountNumber,
            ifsc,
            holderName,
        };

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Bank details updated successfully",
            bankDetails: user.bankDetails,
        });
    } catch (error) {
        console.log(chalk.red("Error in updateBankDetails"), error);
        return res.status(500).json({ message: error.message });
    }
};
