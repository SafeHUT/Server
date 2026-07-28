import crypto from "crypto";
import { 
    createUser,  
    deleteCurrentUser, 
    updateAnonymousId, 
    updateUserName 
} from "../services/user.service.js";
import { asyncHandler } from "../utils/apiHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import generateAccessToken from "../utils/generateToken.js";

const generate_user = asyncHandler(async(req, res) => {
    const anonymousId = crypto.randomBytes(6).toString("hex");
    const user = await createUser(anonymousId); 
    
    const accessToken = generateAccessToken(user.id, user.anonymous_id);

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                user: user,
                accessToken: accessToken
            },
            "User generated successfully"
        )
    );
}); 

const get_current_user = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        )
    );
});

const update_name = asyncHandler(async (req, res) => {

    let { name } = req.body;
    if( !name || name.trim().length === 0 ) {
        throw new ApiError(400, "Name field is required");
    }

    const updatedUser = await updateUserName(req.user.id, name.trim()); 

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser, 
            "Name updated successfully"
        )
    );
});

const delete_current_user = asyncHandler(async (req,res) => {
    const id = req.user.id;
    await deleteCurrentUser(id);
    
    return res.status(200).json(
        new ApiResponse(200, null, "User deleted successfully")
    );
});

const generate_new_anonymous_id = asyncHandler(async (req, res) => {
    const newAnonymousId = crypto.randomBytes(6).toString("hex");
    const userId = req.user.id; 

    const updatedUser = await updateAnonymousId(newAnonymousId, userId);

    const newAccessToken = generateAccessToken(updatedUser.id, updatedUser.anonymous_id);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: updatedUser,
                accessToken: newAccessToken
            },
            "Anonymous ID regenerated successfully"
        )
    );
});
export {
    generate_user,
    get_current_user,
    update_name,
    delete_current_user,
    generate_new_anonymous_id
};