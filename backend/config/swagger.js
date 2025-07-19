const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Long Island Korea API',
      version: '1.0.0',
      description: 'Long Island Korea 커뮤니티 사이트 API 문서',
      contact: {
        name: 'API Support',
        email: 'support@likorea.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: '개발 서버'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: '사용자 고유 ID' },
            id: { type: 'string', description: '사용자 로그인 ID' },
            email: { type: 'string', format: 'email', description: '이메일' },
            authority: { type: 'number', description: '권한 레벨 (1-5)' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        BoardPost: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: '게시글 고유 ID' },
            boardType: { type: 'string', description: '게시판 타입' },
            title: { type: 'string', description: '제목' },
            content: { type: 'string', description: '내용' },
            author: { 
              type: 'object', 
              properties: {
                _id: { type: 'string' },
                id: { type: 'string' },
                email: { type: 'string' }
              }
            },
            viewCount: { type: 'number', description: '조회수' },
            postNumber: { type: 'number', description: '글번호' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: '댓글 고유 ID' },
            content: { type: 'string', description: '댓글 내용' },
            author: { 
              type: 'object', 
              properties: {
                _id: { type: 'string' },
                id: { type: 'string' },
                email: { type: 'string' }
              }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', description: '에러 메시지' },
            statusCode: { type: 'number', description: 'HTTP 상태 코드' }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './controllers/*.js'] // API 라우트 파일들
};

const specs = swaggerJsdoc(options);

module.exports = specs; 