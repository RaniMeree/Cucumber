import React from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.png'; // Adjust path as needed

const Header = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="header-banner" style={{ 
      padding: '10px',
      backgroundColor: '#000000',
      color: 'white'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <img 
            src={logo} 
            alt="Logo" 
            className="logo" 
            style={{ width: '175px', height: 'auto' }}
          />
          <select 
            onChange={(e) => changeLanguage(e.target.value)}
            value={i18n.language}
            style={{
              padding: '5px',
              borderRadius: '4px',
              backgroundColor: 'white',
              border: 'none',
              width: '100px'
            }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="it">Italiano</option>
            <option value="ar">العربية</option>
            <option value="sv">Svenska</option>
            <option value="de">Deutsch</option>
            <option value="nl">Nederlands</option>
            <option value="fr">Français</option>
            <option value="fa">فارسی</option>
            <option value="fi">Suomi</option>
            <option value="da">Dansk</option>
            <option value="el">Ελληνικά</option>
            <option value="ru">Русский</option>
            <option value="tr">Türkçe</option>
            <option value="pt">Português</option>
            <option value="ja">日本語</option>
            <option value="hi">हिंदी</option>
            <option value="ku">کوردی</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Header; 