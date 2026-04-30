import { toast } from "sonner";

 export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const validateFile = (file: File, options: { maxSize: number; allowedTypes: string[] }) => {
  if (file.size > options.maxSize) {
    const sizeInMB = (options.maxSize / (1024 * 1024)).toFixed(0);
    toast.error(`Arquivo muito grande: "${file.name}"`, {
      description: `O tamanho máximo permitido é de ${sizeInMB}MB.`
    });
    return false;
  }

  if (!options.allowedTypes.includes(file.type)) {
    toast.error(`Tipo de arquivo não permitido: "${file.name}"`, {
      description: "Por favor, envie um formato compatível."
    });
    return false;
  }

  return true;
};

export const validateImage = (file: File) => validateFile(file, { 
  maxSize: MAX_IMAGE_SIZE, 
  allowedTypes: ALLOWED_IMAGE_TYPES 
});

export const validateDocument = (file: File) => validateFile(file, { 
  maxSize: MAX_DOC_SIZE, 
  allowedTypes: ALLOWED_DOC_TYPES 
});
