 import React, { useState, useCallback } from 'react';
 import Cropper from 'react-easy-crop';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Slider } from "@/components/ui/slider";
 import { Label } from "@/components/ui/label";
 
 interface ImageCropperProps {
   image: string;
   aspect?: number;
   onCropComplete: (croppedImage: Blob) => void;
   onCancel: () => void;
 }
 
 const createImage = (url: string): Promise<HTMLImageElement> =>
   new Promise((resolve, reject) => {
     const image = new Image();
     image.addEventListener('load', () => resolve(image));
     image.addEventListener('error', (error) => reject(error));
     image.setAttribute('crossOrigin', 'anonymous');
     image.src = url;
   });
 
 async function getCroppedImg(
   imageSrc: string,
   pixelCrop: { x: number; y: number; width: number; height: number }
 ): Promise<Blob> {
   const image = await createImage(imageSrc);
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
 
   if (!ctx) {
     throw new Error('No 2d context');
   }
 
   canvas.width = pixelCrop.width;
   canvas.height = pixelCrop.height;
 
   ctx.drawImage(
     image,
     pixelCrop.x,
     pixelCrop.y,
     pixelCrop.width,
     pixelCrop.height,
     0,
     0,
     pixelCrop.width,
     pixelCrop.height
   );
 
   return new Promise((resolve) => {
     canvas.toBlob((blob) => {
       if (blob) resolve(blob);
     }, 'image/jpeg');
   });
 }
 
 export function ImageCropper({ image, aspect = 4 / 3, onCropComplete, onCancel }: ImageCropperProps) {
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
 
   const onCropChange = useCallback((crop: { x: number; y: number }) => {
     setCrop(crop);
   }, []);
 
   const onZoomChange = useCallback((zoom: number) => {
     setZoom(zoom);
   }, []);
 
   const onCropCompleteInternal = useCallback((_: any, croppedAreaPixels: any) => {
     setCroppedAreaPixels(croppedAreaPixels);
   }, []);
 
   const handleCrop = async () => {
     try {
       const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
       onCropComplete(croppedBlob);
     } catch (e) {
       console.error(e);
     }
   };
 
   return (
     <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
       <DialogContent className="sm:max-w-[600px]">
         <DialogHeader>
           <DialogTitle>Recortar Imagem</DialogTitle>
         </DialogHeader>
         <div className="relative h-[400px] w-full bg-black rounded-md overflow-hidden">
           <Cropper
             image={image}
             crop={crop}
             zoom={zoom}
             aspect={aspect}
             onCropChange={onCropChange}
             onCropComplete={onCropCompleteInternal}
             onZoomChange={onZoomChange}
           />
         </div>
         <div className="py-4 space-y-4">
           <div className="space-y-2">
             <Label>Zoom</Label>
             <Slider
               value={[zoom]}
               min={1}
               max={3}
               step={0.1}
               onValueChange={(val) => setZoom(val[0])}
             />
           </div>
         </div>
         <DialogFooter>
           <Button variant="outline" onClick={onCancel}>Cancelar</Button>
           <Button onClick={handleCrop}>Finalizar e Subir</Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }