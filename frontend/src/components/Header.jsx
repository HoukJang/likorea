import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapLocationDot } from '@fortawesome/free-solid-svg-icons';

function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <header className="header" style={{ textAlign: 'center' }}>
            <h1>
                <span style={{ fontSize: '0.54em', display: 'block', marginBottom: '0.1em' }}>
                    한국인의, 한국인에 의한, 한국인을 위한 롱아일랜드 생활정보 커뮤니티
                </span>
                <span style={{ fontSize: '1.4em', fontWeight: 'bold' }}>
                    LongIsland Korea 
                    <img 
                        src="/longisland-shape.png" 
                        alt="Long Island Shape"
                        style={{ 
                            height: '40px',
                            marginLeft: '5px',
                            verticalAlign: 'middle'
                        }}
                    />
                </span>
            </h1>
            <nav>
                {token ? (
                    <>
                        <Link to="#" onClick={handleLogout} style={{ textDecoration: 'none' }}>
                            로그아웃
                        </Link>
                        {' | '}
                        <Link to="/" style={{ textDecoration: 'none' }}>자유 게시판</Link>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none' }}>로그인</Link>
                        {' | '}
                        <Link to="/" style={{ textDecoration: 'none' }}>자유 게시판</Link>
                    </>
                )}
            </nav>
            <hr />
        </header>
    );
}

export default Header;