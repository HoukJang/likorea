import { useRef, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Lazy load image compression library
let imageCompression;
const loadImageCompression = async () => {
  if (!imageCompression) {
    const module = await import('browser-image-compression');
    imageCompression = module.default;
  }
  return imageCompression;
};

// 이미지 압축 설정
const compressionOptions = {
  maxSizeMB: 1, // 최대 1MB로 압축
  maxWidthOrHeight: 1920, // 최대 너비/높이 1920px
  useWebWorker: true,
  quality: 0.8 // 품질 80%
};

// 커스텀 이미지 핸들러
const imageHandler = async function() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (file) {
      try {
        // 이미지 압축
        const compress = await loadImageCompression();
        const compressedFile = await compress(file, compressionOptions);

        // Base64로 변환
        const reader = new FileReader();
        reader.onload = (e) => {
          const range = this.quill.getSelection();
          this.quill.insertEmbed(range.index, 'image', e.target.result);
          // 이미지 다음에 줄바꿈 추가
          this.quill.insertText(range.index + 1, '\n');
          // 커서를 이미지 다음으로 이동
          this.quill.setSelection(range.index + 2);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        alert('이미지 업로드 중 오류가 발생했습니다.');
        if (process.env.NODE_ENV === 'development') {
          console.error('Image compression error:', error);
        }
      }
    }
  };
};

// 한국어 툴팁 추가
const addTooltips = () => {
  const tooltips = {
    'ql-bold': '굵게',
    'ql-italic': '기울임',
    'ql-underline': '밑줄',
    'ql-strike': '취소선',
    'ql-header': '제목',
    'ql-list[value="ordered"]': '번호 목록',
    'ql-list[value="bullet"]': '글머리 기호',
    'ql-indent[value="-1"]': '들여쓰기 감소',
    'ql-indent[value="+1"]': '들여쓰기 증가',
    'ql-color': '글자색',
    'ql-background': '배경색',
    'ql-align': '정렬',
    'ql-link': '링크',
    'ql-image': '이미지',
    'ql-clean': '서식 지우기',
    'ql-blockquote': '인용문',
    'ql-code-block': '코드 블록'
  };

  Object.entries(tooltips).forEach(([selector, tooltip]) => {
    const elements = document.querySelectorAll(`.ql-toolbar .${selector}`);
    elements.forEach(element => {
      element.setAttribute('title', tooltip);
    });
  });
};

function QuillEditor({ value, onChange, placeholder = '내용을 입력하세요...' }) {
  const quillRef = useRef(null);

  // Quill 모듈 설정 (간소화된 툴바)
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],  // 헤더 옵션 줄임
        ['bold', 'italic', 'underline'],  // strike 제거
        ['blockquote'],  // code-block 제거 (일반 사용자에게는 불필요)
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  // Quill 포맷 설정
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background',
    'align'
  ];

  // 붙여넣기 이미지 처리 및 한국어 툴팁 추가
  useEffect(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();

      // 한국어 툴팁 추가
      setTimeout(() => {
        addTooltips();
      }, 100);

      quill.root.addEventListener('paste', async (e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        const items = clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();

            try {
              // 이미지 압축
              const compress = await loadImageCompression();
              const compressedFile = await compress(file, compressionOptions);

              // Base64로 변환
              const reader = new FileReader();
              reader.onload = (event) => {
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', event.target.result);
                // 이미지 다음에 줄바꿈 추가
                quill.insertText(range.index + 1, '\n');
                // 커서를 이미지 다음으로 이동
                quill.setSelection(range.index + 2);
              };
              reader.readAsDataURL(compressedFile);
            } catch (error) {
              alert('이미지 압축 중 오류가 발생했습니다.');
              if (process.env.NODE_ENV === 'development') {
                console.error('Image paste error:', error);
              }
            }
            return;
          }
        }
      });
    }
  }, []);

  // 스타일 설정
  const editorStyle = {
    height: '400px',
    backgroundColor: 'white'
  };

  return (
    <div className="quill-editor-container">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={editorStyle}
      />
    </div>
  );
}

export default QuillEditor;