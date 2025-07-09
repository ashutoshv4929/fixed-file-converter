import React from 'react';

function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (response.body) {
        const reader = response.body.getReader();
        if (reader) {
          const decoder = new TextDecoder();
          let content = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              onFinish(content);
              break;
            }
            const chunk = decoder.decode(value, { stream: true });
            content += chunk;
            onChunk(content);
          }
        }
      }
    },
    [onChunk, onFinish]
  );
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      console.log('Starting upload with input:', input);
      
      // Handle both direct file input and react native asset
      const file = input.file || (input.reactNativeAsset && input.reactNativeAsset.file);
      
      if (!file) {
        const error = new Error('No file provided for upload');
        console.error('Upload error:', error);
        throw error;
      }
      
      console.log('Processing file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
        isBlob: file instanceof Blob
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending upload request to /_create/api/upload/');
      
      let response;
      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        const response = await fetch("/_create/api/upload/presign/", {
          method: 'POST',
        })
        const { secureSignature, secureExpire } = await response.json();
        const result = await client.uploadFile(input.reactNativeAsset, {
          fileName: input.reactNativeAsset.name ?? input.reactNativeAsset.uri.split("/").pop(),
          contentType: input.reactNativeAsset.mimeType,
          secureSignature,
          secureExpire
        });
        return { url: `${process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL}/${result.uuid}/`, mimeType: result.mimeType || null };
      } else if ("file" in input && input.file) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          body: formData
        });
      } else if ("url" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ url: input.url })
        });
      } else if ("base64" in input) {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ base64: input.base64 })
        });
      } else {
        response = await fetch("/_create/api/upload/", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream"
          },
          body: input.buffer
        });
      }
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload failed: File too large.");
        }
        throw new Error("Upload failed");
      }
      const data = await response.json();
      return { url: data.url, mimeType: data.mimeType || null };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export {
  useHandleStreamResponse,
  useUpload,
}
