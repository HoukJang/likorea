const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      // 토큰을 검증하고 디코딩된 정보를 req.user에 할당
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      console.error("토큰 검증 실패:", err);
      return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
    }
  } else {
    return res.status(401).json({ error: "인증 토큰이 없습니다." });
  }
}

module.exports = authMiddleware;