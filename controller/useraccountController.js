import userSchema from "../model/userModel.js";
import { log } from "mercedlogger";


const updateProfile = async (req, res) => {
    try {
        const { fullname } = req.body;
        const userId = req.session.user.id;
        const updatedUser = await userSchema.findByIdAndUpdate(
            userId,
            { fullname },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            user: updatedUser 
        });

    } catch (error) {
        log.red("Error in updateProfile:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};

export default { updateProfile };