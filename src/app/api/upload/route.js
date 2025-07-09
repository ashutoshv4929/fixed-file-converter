import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// This is a simple in-memory storage for demo purposes
// In production, you should use a proper file storage service like AWS S3
const uploads = new Map();

export async function POST(request) {
  try {
    console.log('Upload request received');
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      console.error('No file found in the request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Convert the file data to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // In a real app, you would upload to a cloud storage service here
    // For demo, we'll just store the buffer in memory
    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      data: buffer,
      uploadedAt: new Date().toISOString()
    };
    
    // Store file data (in-memory for demo)
    const fileId = uuidv4();
    uploads.set(fileId, fileData);
    
    // Create a URL to access the file
    // In production, this would be a URL to your cloud storage
    const fileUrl = `/api/files/${fileId}`;
    
    console.log('File uploaded successfully:', fileId);
    
    return NextResponse.json({
      success: true,
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      id: fileId
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Error processing file upload' },
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
      'Content-Length': fileData.size
    }
  });
}
