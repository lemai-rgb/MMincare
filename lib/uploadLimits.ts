// Reserve space for the multipart envelope below Vercel's request-body limit.
export const MAX_UPLOAD_FILE_MIB = 4;
export const MAX_UPLOAD_FILE_BYTES = MAX_UPLOAD_FILE_MIB * 1024 * 1024;
