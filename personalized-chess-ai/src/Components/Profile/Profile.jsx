import React, { useState, useRef, useEffect } from "react";
import "./Profile.css";
import Header from "../Header/Header";
import avatar_default from "./avatar_default.png";

const Profile = () => {
    const [avatar, setAvatar] = useState(avatar_default);
    const fileInputRef = useRef(null);

     // Handle when a new image is selected
     const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatar(e.target.result); // Update avatar with the uploaded image
            };
            reader.readAsDataURL(file);
        }
    };

    // Trigger the hidden file input when avatar is clicked
    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };


    return (
        <div>
            <Header />
            <div className="profile-container">
                <img
                    src={avatar}
                    alt="Profile"
                    className="profile-avatar"
                    onClick={handleAvatarClick} // Click event to trigger file input
                />
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }} // Hidden file input
                    onChange={handleImageChange}
                />
            </div>
        </div>
    );
};

export default Profile;
