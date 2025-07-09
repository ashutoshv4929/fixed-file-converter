import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const config = {
  // Maximum file size (10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Allowed file types
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ],
  
  // In-memory storage (for demo)
  storage: new Map(),
  
  // File storage directory (for persistent storage)
  uploadDir: path.join(process.cwd(), 'uploads'),
};

/**
 * Handles file uploads
 */
export async function POST(request) {
  try {
    // Ensure upload directory exists
    await fs.mkdir(config.uploadDir, { recursive: true });
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    // Validate file
    if (!file) {
      return createErrorResponse('No file provided', 400);
    }
    
    // File validation
    const validationError = validateFile(file);
    if (validationError) {
      return validationError;
    }
    
    // Process file
    const { fileId, filePath, fileName } = await storeFile(file);
    
    // Create file metadata
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      path: filePath,
      url: `/api/files/${fileId}`,
      uploadedAt: new Date().toISOString()
    };
    
    // Store metadata in memory
    config.storage.set(fileId, fileData);
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: fileData
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return createErrorResponse('Failed to process file upload', 500, error);
  }
}

/**
 * Serves uploaded files
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const fileId = url.pathname.split('/').pop();
    
    // Validate file ID
    if (!fileId || !config.storage.has(fileId)) {
      return createErrorResponse('File not found', 404);
    }
    
    const fileData = config.storage.get(fileId);
    
    // Read file from disk
    const fileBuffer = await fs.readFile(fileData.path);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileData.type,
        'Content-Disposition': `inline; filename="${fileData.name}"`,
        'Content-Length': fileData.size,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
    
  } catch (error) {
    console.error('File serve error:', error);
    return createErrorResponse('Failed to serve file', 500, error);
  }
}

/**
 * Validates a file against configured constraints
 */
function validateFile(file) {
  // Check file size
  if (file.size > config.maxFileSize) {
    const error = `File too large. Max size is ${config.maxFileSize / (1024 * 1024)}MB`;
    return createErrorResponse(error, 400);
  }
  
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return createErrorResponse(`File type ${file.type} is not allowed`, 400);
  }
  
  return null;
}

/**
 * Stores a file on disk and returns its metadata
 */
async function storeFile(file) {
  const fileId = uuidv4();
  const fileExt = path.extname(file.name);
  const fileName = `${fileId}${fileExt}`;
  const filePath = path.join(config.uploadDir, fileName);
  
  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Write file to disk
  await fs.writeFile(filePath, buffer);
  
  return { fileId, filePath, fileName };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(message, status = 500, error = null) {
  const response = {
    success: false,
    error: message,
  };
  
  // Add error details in development
  if (process.env.NODE_ENV === 'development' && error) {
    response.details = {
      message: error.message,
      stack: error.stack,
    };
  }
  
  return NextResponse.json(response, { status });
}

// Add a GET endpoint to serve the uploaded files
export async function GET(request) {
  const url = new URL(request.url);
  const fileId = url.pathname.split('/').pop();
  
  if (!fileId || !uploads.has(fileId)) {
    return new NextResponse('File not found', { status: 404 });
  }
  
  const fileData = uploads.get(fileId);
  
  return new NextResponse(fileData.data, {
    headers: {
      'Content-Type': fileData.type,
      'Content-Disposition': `inline; filename="${fileData.name}"`,
      'Content-Length': fileData.size
    }
  });
}
