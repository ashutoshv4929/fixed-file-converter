import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Here you would typically process the file
    // For now, we'll just return a success response with file info
    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      type: file.type
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Error processing file upload' },
      { status: 500 }
    );
  }
}
