import React, { useEffect, useState } from 'react';
import './LanguageSelection.css';

interface LanguageSelectionProps {
  onSelect: (lang: 'zh' | 'en' | 'vi') => void;
}

const LanguageSelection: React.FC<LanguageSelectionProps> = ({ onSelect }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className={`lang-container ${visible ? 'visible' : ''}`}>
      <div className="lang-header">
        <h1>Jingshin</h1>
        <p>Please select your language / 請選擇語言</p>
      </div>
      
      <div className="lang-grid">
        <button 
          className="lang-card zh"
          onClick={() => onSelect('zh')}
        >
          <div className="flag">🇹🇼</div>
          <div className="lang-name">繁體中文</div>
          <div className="lang-sub">Traditional Chinese</div>
        </button>

        <button 
          className="lang-card en"
          onClick={() => onSelect('en')}
        >
          <div className="flag">🇺🇸</div>
          <div className="lang-name">English</div>
          <div className="lang-sub">英文</div>
        </button>

        <button 
          className="lang-card vi"
          onClick={() => onSelect('vi')}
        >
          <div className="flag">🇻🇳</div>
          <div className="lang-name">Tiếng Việt</div>
          <div className="lang-sub">Vietnamese</div>
        </button>
      </div>
    </div>
  );
};

export default LanguageSelection;
