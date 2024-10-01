import "./Header.css";
import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const pages = ["Profile", "Board", "Log Out"];

const pageLinks = {
    "Profile": "/Profile",
    "Board": "/Board",
    "Log Out": "/"
};

function Header() {
    const [activePage, setActivePage] = useState(pages[0]);
    const navigate = useNavigate();

    const handlePageClick = (page) => {
        setActivePage(page);
        navigate(pageLinks[page]);
    };

    return (
        <div className="page-header">
            {pages.map((page) => (
                <div key={page} 
                    active={activePage === page} 
                    onClick={() => handlePageClick(page)} 
                    className="header-item"
                >
                    {page}
                </div>
            ))}
        </div>
    );
};

export default Header;