import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="header">
            <h1>LongIsland Korea 게시판</h1>
            <nav>
                <Link to="/">게시글 목록</Link> | <Link to="/create">새 글 작성</Link>
            </nav>
            <hr/>
        </header>
    );
}

export default Header;