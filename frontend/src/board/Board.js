// // src/board/Board.js

// class Board {
//   constructor(name, type) {
//     this.name = name;
//     this.type = type; // e.g. 'free' or 'buy-sell'
//   }

//   async createPost(postData) {
//     // Assumes postData contains title, content, and author info (from logged in user)
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(postData)
//     });
//     return res.json();
//   }

//   async editPost(postId, postData) {
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}/${postId}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(postData)
//     });
//     return res.json();
//   }

//   async deletePost(postId) {
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}/${postId}`, {
//       method: 'DELETE'
//     });
//     return res.json();
//   }

//   async addComment(postId, commentData) {
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}/${postId}/comments`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(commentData)
//     });
//     return res.json();
//   }

//   async editComment(postId, commentId, commentData) {
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}/${postId}/comments/${commentId}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(commentData)
//     });
//     return res.json();
//   }

//   async deleteComment(postId, commentId) {
//     const res = await fetch(`http://localhost:5000/api/boards/${this.type}/${postId}/comments/${commentId}`, {
//       method: 'DELETE'
//     });
//     return res.json();
//   }
// }

// export default Board;