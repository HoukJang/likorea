// main.js

// 예시: DOM이 로드된 후 이벤트 리스너 달기
document.addEventListener("DOMContentLoaded", () => {
    console.log("LongIsland Korea 웹사이트에 오신 것을 환영합니다!");
  
    // 예시: 버튼 클릭 시 동작
    const heroButton = document.querySelector(".hero button");
    if (heroButton) {
      heroButton.addEventListener("click", () => {
        alert("롱아일랜드 지역 정보를 더 살펴보세요!");
      });
    }
  });
  