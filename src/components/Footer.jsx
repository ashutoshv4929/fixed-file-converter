import Link from 'next/link';
import styles from '../app/converter/converter.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h4>File Converter</h4>
          <p>Convert your files to different formats quickly and securely.</p>
        </div>
        
        <div className={styles.footerSection}>
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/converter">File Converter</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4>Supported Formats</h4>
          <ul>
            <li>PDF, DOC, DOCX</li>
            <li>XLS, XLSX, CSV</li>
            <li>JPG, PNG, GIF</li>
            <li>TXT, and more</li>
          </ul>
        </div>
        
        <div className={styles.footerSection}>
          <h4>Contact</h4>
          <p>Email: support@fileconverter.example.com</p>
          <div className={styles.socialLinks}>
            <a href="https://twitter.com/fileconverter" target="_blank" rel="noopener noreferrer">
              Twitter
            </a>
            <a href="https://github.com/yourusername/file-converter" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} File Converter. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
