async function handler({ files, conversionType }) {
  // CloudConvert API configuration
  const CLOUDCONVERT_API_KEY = process.env.NEXT_PUBLIC_CLOUD_CONVERT_API_KEY;
  
  if (!CLOUDCONVERT_API_KEY) {
    console.error('CloudConvert API key is not set');
    return { error: 'Server configuration error' };
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return { error: "No files provided" };
  }

  if (!conversionType) {
    return { error: "No conversion type specified" };
  }

  try {
    const convertedFiles = [];

    // Handle image-to-text conversion specially
    if (conversionType === "image-to-text") {
      for (const file of files) {
        try {
          // Extract text from image using OCR
          const extractedText = await extractTextFromImage(file);

          // Create a Word document with the extracted text
          const wordDoc = await createWordDocument(extractedText, file.name);

          convertedFiles.push({
            name: wordDoc.name,
            url: wordDoc.url,
            size: wordDoc.size || 0,
            description: `Text extracted from ${file.name}`,
            textContent: extractedText, // Include text for preview
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          convertedFiles.push({
            name: `${file.name}_error.txt`,
            url: "#",
            size: 0,
            description: `Error: ${error.message}`,
            textContent: `Error extracting text from ${file.name}: ${error.message}`,
          });
        }
      }

      return { convertedFiles };
    }

    // Handle other conversion types
    for (const file of files) {
      // Create a job
      const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tasks: {
            "import-file": {
              operation: "import/url",
              url: file.url,
            },
            "convert-file": {
              operation: "convert",
              input: "import-file",
              output_format: getOutputFormat(conversionType),
              options: getConversionOptions(conversionType),
            },
            "export-file": {
              operation: "export/url",
              input: "convert-file",
            },
          },
        }),
      });

      if (!jobResponse.ok) {
        throw new Error(
          `CloudConvert job creation failed: ${jobResponse.statusText}`
        );
      }

      const job = await jobResponse.json();

      // Wait for job completion
      let jobStatus = job;
      while (
        jobStatus.data.status === "waiting" ||
        jobStatus.data.status === "processing"
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

        const statusResponse = await fetch(
          `https://api.cloudconvert.com/v2/jobs/${job.data.id}`,
          {
            headers: {
              Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
            },
          }
        );

        if (!statusResponse.ok) {
          throw new Error(
            `Failed to check job status: ${statusResponse.statusText}`
          );
        }

        jobStatus = await statusResponse.json();
      }

      if (jobStatus.data.status === "error") {
        throw new Error(
          `Conversion failed: ${jobStatus.data.message || "Unknown error"}`
        );
      }

      // Get the export task to find the download URL
      const exportTask = jobStatus.data.tasks.find(
        (task) => task.name === "export-file"
      );
      if (
        !exportTask ||
        !exportTask.result ||
        !exportTask.result.files ||
        exportTask.result.files.length === 0
      ) {
        throw new Error("No converted file found in job result");
      }

      const convertedFile = exportTask.result.files[0];
      const outputExtension = getOutputFormat(conversionType);
      const baseName =
        file.name.substring(0, file.name.lastIndexOf(".")) || file.name;

      convertedFiles.push({
        name: `${baseName}.${outputExtension}`,
        url: convertedFile.url,
        size: convertedFile.size,
        description: `Converted from ${file.name}`,
      });
    }

    return { convertedFiles };
  } catch (error) {
    console.error("CloudConvert API error:", error);
    return {
      error: `Conversion failed: ${error.message}`,
    };
  }
}

function getOutputFormat(conversionType) {
  const formatMap = {
    "pdf-to-word": "docx",
    "pdf-to-excel": "xlsx",
    "pdf-to-powerpoint": "pptx",
    "pdf-to-jpg": "jpg",
    "word-to-pdf": "pdf",
    "excel-to-pdf": "pdf",
    "powerpoint-to-pdf": "pdf",
    "jpg-to-pdf": "pdf",
    "png-to-pdf": "pdf",
    "merge-pdf": "pdf",
    "split-pdf": "pdf",
    "compress-pdf": "pdf",
  };

  return formatMap[conversionType] || "pdf";
}

function getConversionOptions(conversionType) {
  const options = {};

  // Add specific options based on conversion type
  switch (conversionType) {
    case "pdf-to-jpg":
      options.format = "jpg";
      options.quality = 90;
      break;
    case "compress-pdf":
      options.pdf_a = false;
      options.optimize_print = true;
      break;
    case "merge-pdf":
      // For merge, we'll need to handle multiple files differently
      break;
    default:
      break;
  }

  return options;
}

// Function to extract text from images using CloudConvert OCR
async function extractTextFromImage(file) {
  const CLOUDCONVERT_API_KEY =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiM2RlNTU2NjBkNTJhM2E1NzJlNDcxNTcyZDdkOTgzYTA5MDNlY2JmMDNjNGQyZGIzZDk4MWE1ZTJiNGM5YjkwOGRhZmJiNDc2NzIwNjNmMDMiLCJpYXQiOjE3NTE5ODM5ODkuMDkzOTYxLCJuYmYiOjE3NTE5ODM5ODkuMDkzOTYyLCJleHAiOjQ5MDc2NTc1ODkuMDg5Mzk3LCJzdWIiOiI3MjM4NjMyNyIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsInByZXNldC5yZWFkIiwid2ViaG9vay53cml0ZSIsInByZXNldC53cml0ZSJdfQ.YMO8hVw2cqG0bSBzlltY0yoJy0x1xhV3vR0ptuaL3dE8idPLAd1mjuooDLYG4-4mD35AEa5Xvd3WqhHIgB9juPFWUMjo2TH3EvzpDA7uNhagiClTr5NNZWeubuNruD1uw01cugcZg8Yj6-PmVKLka9AA1pEIkkZM95kDcqMpZSP_VsfE-YLTI48kI_AXwAGlPew8GxFdyIE4Ugm4HQKt3YaSqbg6e6bbYveohjQify0g4VaU9IHtrCIooOKnzz0xXjfexG6mZ8lymON1xztOJoFJ4aiOSOHJwuB7oxaCffzLkRGN945Ut3H9x2cB7ubXEJPP84yIXTJ-VOHxFyH__Y9wHK6asPtktS44wmzBS7zDSse9PkJoOAHFVZXHcsbjAdSlGUDQZDDjVBCxYECUdSXw_vWyAgWan6tXrNQx9A51x7-xVehld9D31FP2IMQA2gVwZEQjBe5OqO1sd1iDH7wdKEgh85H2SDKcbnI3siBMTkbTJH2zV2xc7i3qX9fC03qBEra6BvQT_xAtQy73Q8zoGXYaPtQxLLyN9qiGYYXYIndxAPRwJONrTq-O_EldPnv_gce4qjB4Q8crglSSjDQxI8b9xhGwOK1g6utPbeA0BVsxizR4FjQbpxB-uYKw8OhqXm5xJe3QjBvmiGJWf1HWefVlu8xnSm2aG7CJoLk";

  try {
    // Create OCR job using CloudConvert
    const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-file": {
            operation: "import/url",
            url: file.url,
          },
          "ocr-file": {
            operation: "convert",
            input: "import-file",
            output_format: "txt",
            options: {
              ocr_engine: "tesseract",
              ocr_language: "eng",
            },
          },
          "export-file": {
            operation: "export/url",
            input: "ocr-file",
          },
        },
      }),
    });

    if (!jobResponse.ok) {
      throw new Error(`OCR job creation failed: ${jobResponse.statusText}`);
    }

    const job = await jobResponse.json();

    // Wait for job completion
    let jobStatus = job;
    while (
      jobStatus.data.status === "waiting" ||
      jobStatus.data.status === "processing"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.cloudconvert.com/v2/jobs/${job.data.id}`,
        {
          headers: {
            Authorization: `Bearer ${CLOUDCONVERT_API_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to check OCR job status: ${statusResponse.statusText}`
        );
      }

      jobStatus = await statusResponse.json();
    }

    if (jobStatus.data.status === "error") {
      throw new Error(
        `OCR failed: ${jobStatus.data.message || "Unknown error"}`
      );
    }

    // Get the export task to find the text file
    const exportTask = jobStatus.data.tasks.find(
      (task) => task.name === "export-file"
    );

    if (
      !exportTask ||
      !exportTask.result ||
      !exportTask.result.files ||
      exportTask.result.files.length === 0
    ) {
      throw new Error("No OCR result found");
    }

    // Download the text content
    const textFileUrl = exportTask.result.files[0].url;
    const textResponse = await fetch(textFileUrl);

    if (!textResponse.ok) {
      throw new Error("Failed to download extracted text");
    }

    const extractedText = await textResponse.text();
    return extractedText.trim();
  } catch (error) {
    console.error("OCR extraction error:", error);
    return `Error extracting text: ${error.message}`;
  }
}
export async function POST(request) {
  return handler(await request.json());
}