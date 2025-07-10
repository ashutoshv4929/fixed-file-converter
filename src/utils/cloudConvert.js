import { CloudConvert } from '@cloudconvert/cloudconvert';

// Initialize CloudConvert client
const cloudConvert = new CloudConvert(process.env.NEXT_PUBLIC_CLOUDCONVERT_API_KEY);

export async function convertFile(file, targetFormat) {
  try {
    // 1. Create a job
    let job = await cloudConvert.jobs.create({
      tasks: {
        'upload-file': {
          operation: 'import/upload',
          file: file
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

    // 2. Upload the file
    const uploadTask = job.tasks.filter(task => task.operation === 'import/upload')[0];
    await cloudConvert.tasks.upload(uploadTask, file);

    // 3. Wait for job completion
    job = await waitForJobCompletion(job.id);
    
    // 4. Get the download URL
    const exportTask = job.tasks.filter(task => task.operation === 'export/url' && task.status === 'finished')[0];
    const fileUrl = exportTask.result.files[0].url;
    
    return {
      success: true,
      url: fileUrl,
      filename: exportTask.result.files[0].filename,
      size: file.size
    };
  } catch (error) {
    console.error('Error converting file:', error);
    return {
      success: false,
      error: error.message || 'Failed to convert file'
    };
  }
}

async function waitForJobCompletion(jobId) {
  return new Promise((resolve, reject) => {
    const checkJob = async () => {
      try {
        const job = await cloudConvert.jobs.get(jobId);
        
        if (job.status === 'finished') {
          resolve(job);
        } else if (job.status === 'error') {
          reject(new Error('Job failed'));
        } else {
          // Check again after a delay
          setTimeout(checkJob, 1000);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    checkJob();
  });
}

function getFileExtension(filename) {
  return filename.split('.').pop();
}
