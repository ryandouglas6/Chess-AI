import React, { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./Profile.css";
import Header from "../../Pages/Header/Header";
import avatar_default from "./avatar_default.png";

const Profile = () => {
    const [avatar, setAvatar] = useState(avatar_default);
    const fileInputRef = useRef(null);

    // Sample ELO rating data - replace with actual data from your backend
    const eloData = [
        { date: 'Jan', rating: 1200 },
        { date: 'Feb', rating: 1250 },
        { date: 'Mar', rating: 1225 },
        { date: 'Apr', rating: 1300 },
        { date: 'May', rating: 1275 },
        { date: 'Jun', rating: 1350 }
    ];

    // Handle when a new image is selected
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatar(e.target.result);
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
                <div className="profile-left">
                    <img
                        src={avatar}
                        alt="Profile"
                        className="profile-avatar"
                        onClick={handleAvatarClick}
                    />
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                    />
                    <h2 className="profile-elo">Current ELO: {eloData[eloData.length - 1].rating}</h2>
                </div>
                
                <div className="profile-graph">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={eloData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis 
                                domain={['dataMin - 100', 'dataMax + 100']}
                                label={{ value: 'ELO Rating', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="rating"
                                stroke="#8884d8"
                                strokeWidth={2}
                                dot={{ r: 6 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Profile;