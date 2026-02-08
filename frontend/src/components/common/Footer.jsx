import { Link } from 'react-router-dom';
import packageJson from '../../../package.json';
import '../../styles/Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <span className="logo-li">LI</span>
            <span className="logo-korea">KOREA</span>
          </span>
          <p className="footer-tagline">롱아일랜드 한인 커뮤니티</p>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <Link to="/boards">게시판</Link>
          <Link to="/login">로그인</Link>
          <Link to="/signup">회원가입</Link>
        </nav>

        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Long Island Korea. All rights reserved.
          <span className="footer-version">v{packageJson.version}</span>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
