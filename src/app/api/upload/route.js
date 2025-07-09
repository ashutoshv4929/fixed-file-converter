import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Simple in-memory storage for demo purposes
const uploads = new Map();

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
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
];

export async function POST(request) {
  try {
    console.log('=== New Upload Request ===');
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      console.error('No file found in form data');
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }

    console.log('File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isFile: file instanceof File,
      isBlob: file instanceof Blob
    });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const error = `File too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      const error = `File type ${file.type} is not allowed`;
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Read file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExt}`;
    
    // Store file in memory
    const fileData = {
      id: fileId,
      name: file.name,
      type: file.type,
      size: file.size,
      data: buffer,
      uploadedAt: new Date().toISOString(),
      url: `/api/files/${fileId}`
    };
    
    uploads.set(fileId, fileData);
    
    console.log(`File stored successfully. ID: ${fileId}, Size: ${file.size} bytes`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileData.url
    });
    
  } catch (error) {
    console.error('Error in upload handler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process file upload',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
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
      'Content-Length': fileData.size,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
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
