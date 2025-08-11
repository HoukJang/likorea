import Profile from '../../components/Profile';
import '../../styles/Admin.css';

function AdminProfile() {
  return (
    <section
      className="admin-section"
      id="profile-panel"
      role="tabpanel"
      aria-labelledby="profile-tab"
    >
      <div className="section-header">
        <h2>프로필 관리</h2>
        <p className="section-description">관리자 계정 정보 및 설정 관리</p>
      </div>
      <Profile />
    </section>
  );
}

export default AdminProfile;