import { NextResponse } from 'next/server';
import { CloudConvert } from '@cloudconvert/cloudconvert';

// Initialize CloudConvert client
const cloudConvert = new CloudConvert(process.env.NEXT_PUBLIC_CLOUDCONVERT_API_KEY);

// In-memory storage for jobs (in production, use a database)
const jobs = new Map();

export async function POST(request) {
  try {
    const { file, targetFormat } = await request.json();

    if (!file || !targetFormat) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a job
    const job = await cloudConvert.jobs.create({
      tasks: {
        'upload-file': {
          operation: 'import/upload',
          filename: file.name,
        },
        'convert-file': {
          operation: 'convert',
          input: 'upload-file',
          output_format: targetFormat.toLowerCase(),
          engine: 'office',
          input_format: getFileExtension(file.name).toLowerCase(),
          filename: file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat.toLowerCase()
        },
        'export-file': {
          operation: 'export/url',
          input: 'convert-file'
        }
      }
    });

    // Get the upload URL
    const uploadTask = job.tasks.filter(task => task.operation === 'import/upload')[0];
    const uploadUrl = uploadTask.result?.form?.url || uploadTask.result?.url;

    if (!uploadUrl) {
      throw new Error('Failed to get upload URL');
    }

    // Store the job
    jobs.set(jobId, {
      id: job.id,
      status: 'uploading',
      createdAt: new Date().toISOString(),
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      targetFormat,
    });

    return NextResponse.json({
      success: true,
      jobId,
      uploadUrl,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Error creating conversion job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create conversion job' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { success: false, error: 'Missing jobId parameter' },
      { status: 400 }
    );
  }

  try {
    // Check if job exists in our in-memory store
    const jobInfo = jobs.get(jobId);
    if (!jobInfo) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get the latest job status from CloudConvert
    const job = await cloudConvert.jobs.get(jobInfo.id);
    const exportTask = job.tasks.find(task => task.operation === 'export/url');

    // Update job status
    let status = job.status;
    let downloadUrl = null;
    let error = null;

    if (exportTask?.status === 'finished') {
      status = 'finished';
      downloadUrl = exportTask.result?.files?.[0]?.url;
    } else if (job.status === 'error' || exportTask?.status === 'error') {
      status = 'error';
      error = job.message || exportTask?.message || 'Conversion failed';
    }

    // Update our job info
    const updatedJobInfo = {
      ...jobInfo,
      status,
      updatedAt: new Date().toISOString(),
      downloadUrl,
      error,
    };

    jobs.set(jobId, updatedJobInfo);

    return NextResponse.json({
      success: true,
      status,
      downloadUrl,
      error,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}

function getFileExtension(filename) {
  return filename.split('.').pop();
}
