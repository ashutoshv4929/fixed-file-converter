'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FileUploadProvider } from '../../contexts/FileUploadContext';
import FileUploadArea from '../../components/FileUploadArea';
import ConversionOptions from '../../components/ConversionOptions';
import Footer from '../../components/Footer';
import styles from './converter.module.css';

// This is a wrapper component to provide the FileUploadContext
const FileConverterWithProvider = () => {
  return (
    <FileUploadProvider>
      <FileConverterContent />
    </FileUploadProvider>
  );
};

// The main content component that uses the FileUploadContext
const FileConverterContent = () => {
  const [isClient, setIsClient] = useState(false);
  
  // Ensure we're on the client side before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading file converter...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>File Converter - Convert PDF, Word, Excel, Images and more</title>
        <meta 
          name="description" 
          content="Free online file converter. Convert PDF to Word, Excel to PDF, JPG to PDF and more. No installation required." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className={styles.header}>
        <h1>File Converter</h1>
        <p>Convert your files to different formats quickly and securely</p>
      </header>
      
      <main className={styles.main}>
        <FileUploadArea />
        <ConversionOptions />
        
        <div className={styles.info}>
          <h3>How to convert files</h3>
          <ol>
            <li><strong>Select files</strong> by clicking the upload area or dragging and dropping</li>
            <li><strong>Upload files</strong> to our secure server (files are automatically deleted after 1 hour)</li>
            <li><strong>Choose format</strong> you want to convert to</li>
            <li><strong>Download</strong> your converted files</li>
          </ol>
          
          <h4>Supported file formats</h4>
          <div className={styles.formatGrid}>
            <div className={styles.formatGroup}>
              <h5>Documents</h5>
              <ul>
                <li>PDF (.pdf)</li>
                <li>Word (.doc, .docx)</li>
                <li>Text (.txt)</li>
                <li>Rich Text (.rtf)</li>
              </ul>
            </div>
            
            <div className={styles.formatGroup}>
              <h5>Spreadsheets</h5>
              <ul>
                <li>Excel (.xls, .xlsx)</li>
                <li>CSV (.csv)</li>
                <li>OpenDocument (.ods)</li>
              </ul>
            </div>
            
            <div className={styles.formatGroup}>
              <h5>Presentations</h5>
              <ul>
                <li>PowerPoint (.ppt, .pptx)</li>
                <li>Keynote (.key)</li>
                <li>OpenDocument (.odp)</li>
              </ul>
            </div>
            
            <div className={styles.formatGroup}>
              <h5>Images</h5>
              <ul>
                <li>JPEG (.jpg, .jpeg)</li>
                <li>PNG (.png)</li>
                <li>GIF (.gif)</li>
                <li>WebP (.webp)</li>
              </ul>
            </div>
          </div>
          
          <div className={styles.features}>
            <h4>Why use our file converter?</h4>
            <ul>
              <li>✅ 100% free to use</li>
              <li>✅ No installation required</li>
              <li>✅ Works on all devices</li>
              <li>✅ Secure file handling</li>
              <li>✅ Fast conversions</li>
              <li>✅ No watermarks</li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FileConverterWithProvider;
