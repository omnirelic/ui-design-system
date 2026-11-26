// Sous-export `@omnirelic/ui-design-system/images` : visionneuse d'images, vignettes, dépôt et collage de fichier, réduction d'image, transport d'envoi injecté. Sans routeur.
// La galerie pilotée par `?photo=` (`ImageGallery`, `PhotoLink`, `ProofField`) est dans `/image-gallery` (react-router-dom, peer optionnelle).
export { ImageViewer } from "./ImageViewer";
export type { ImageViewerProps } from "./ImageViewer";
export { ImageThumb } from "./ImageThumb";
export type { ImageThumbProps } from "./ImageThumb";
export { OpenImageContext, useOpenImage } from "./gallery-context";
export type { OpenImage } from "./gallery-context";
export { Thumbnail } from "./Thumbnail";
export type { ThumbnailProps } from "./Thumbnail";
export { MediaFit } from "./MediaFit";
export type { MediaFitProps } from "./MediaFit";
export { PhotoThumb } from "./PhotoThumb";
export type { PhotoThumbProps } from "./PhotoThumb";
export { FileInput } from "./FileInput";
export type { FileInputProps } from "./FileInput";
export { acceptedFiles, attachFileDrop, feedInput, matchesAccept } from "./file-drop";
export { cdnUrl, cdnUrlWatermarked, mediaDownloadUrl, mediaViewUrl, sortGallery } from "./image-urls";
export type { GalleryImage, Watermark } from "./image-urls";
export { MAX_PROOF_BYTES, checkProofFile } from "./proof-file";
export { compressImage, compressedName, photoSize, photoToJpegBase64, scaledSize } from "./image-compress";
export { UploadError, cloudinaryTransport, createCloudinaryUploader, uploadToCloudinaryWithProgress } from "./upload";
export type { CloudinaryConfig, CloudinaryUploader, UploadFailure, UploadTransport } from "./upload";
export { useProofUpload } from "./use-proof-upload";
