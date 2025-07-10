/**
 * Handles file conversion using CloudConvert API
 * @param {File} file - The file to convert
 * @param {string} targetFormat - The target format to convert to
 * @returns {Promise<{success: boolean, url?: string, filename?: string, error?: string}>}
 */
export async function convertFileWithCloudConvert(file, targetFormat) {
  try {
    // 1. Create a conversion job
    const createResponse = await fetch('/api/cloudconvert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
        targetFormat,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.error || 'Failed to create conversion job');
    }

    const { jobId, uploadUrl, method, headers } = await createResponse.json();

    // 2. Upload the file
    const uploadResponse = await fetch(uploadUrl, {
      method,
      body: file,
      headers: {
        ...headers,
        'Content-Length': file.size,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // 3. Poll for conversion completion
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout (60 * 1 second)
    let result;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`/api/cloudconvert?jobId=${jobId}`);
      
      if (!statusResponse.ok) {
        const error = await statusResponse.json();
        throw new Error(error.error || 'Failed to get conversion status');
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'finished') {
        result = {
          success: true,
          url: statusData.downloadUrl,
          filename: file.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat.toLowerCase(),
        };
        break;
      } else if (statusData.status === 'error') {
        throw new Error(statusData.error || 'Conversion failed');
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!result) {
      throw new Error('Conversion timed out');
    }

    return result;
  } catch (error) {
    console.error('Error in convertFileWithCloudConvert:', error);
    return {
      success: false,
      error: error.message || 'Failed to convert file',
    };
  }
}
