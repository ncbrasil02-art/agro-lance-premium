 import React, { useState, useCallback } from 'react';
 import Cropper from 'react-easy-crop';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Slider } from "@/components/ui/slider";
 import { Label } from "@/components/ui/label";
 import { ZoomIn, ZoomOut, RotateCcw, MousePointer2 } from "lucide-react";
 
 interface ImageCropperProps {
   image: string;
   aspect?: number;
   onCropComplete: (croppedImage: Blob) => void;
   onCancel: () => void;
   onApplyToAll?: (pixelCrop: { x: number; y: number; width: number; height: number }) => void;
 }
 
 const createImage = (url: string): Promise<HTMLImageElement> =>
   new Promise((resolve, reject) => {
     const image = new Image();
     image.addEventListener('load', () => resolve(image));
     image.addEventListener('error', (error) => reject(error));
     image.setAttribute('crossOrigin', 'anonymous');
     image.src = url;
   });
 
 export async function getCroppedImg(
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
 
     return new Promise((resolve, reject) => {
       // Usar WebP se suportado para melhor qualidade/tamanho, caso contrário JPEG
       const type = 'image/webp';
       canvas.toBlob((blob) => {
         if (blob) {
           resolve(blob);
         } else {
           // Fallback para JPEG
           canvas.toBlob((jpegBlob) => {
             if (jpegBlob) resolve(jpegBlob);
             else reject(new Error('Falha ao gerar o blob da imagem'));
           }, 'image/jpeg', 0.9);
         }
       }, type, 0.9);
     });
 }
 
   export function ImageCropper({ image, aspect = 4 / 3, onCropComplete, onCancel, onApplyToAll }: ImageCropperProps) {
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
 
   const onCropChange = useCallback((crop: { x: number; y: number }) => {
     setCrop(crop);
   }, []);
 
   const onZoomChange = useCallback((zoom: number) => {
     setZoom(zoom);
   }, []);
 
   const reset = () => {
     setCrop({ x: 0, y: 0 });
     setZoom(1);
   };
 
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
           <div className="relative h-[400px] w-full bg-slate-900 rounded-lg overflow-hidden border-2 border-slate-800">
             <Cropper
               image={image}
               crop={crop}
               zoom={zoom}
               aspect={aspect}
               onCropChange={onCropChange}
               onCropComplete={onCropCompleteInternal}
               onZoomChange={onZoomChange}
               showGrid={true}
             />
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] text-white font-medium flex items-center gap-2 pointer-events-none z-10 border border-white/10">
               <MousePointer2 className="h-3 w-3 text-gold" />
               Arraste para ajustar • Use o scroll para zoom
             </div>
           </div>
           <div className="py-4 flex items-center gap-4">
             <div className="flex-1 space-y-2">
               <div className="flex items-center justify-between">
                 <Label className="text-xs font-bold uppercase text-muted-foreground">Zoom</Label>
                 <span className="text-[10px] font-mono text-muted-foreground">{zoom.toFixed(1)}x</span>
               </div>
               <div className="flex items-center gap-2">
                 <ZoomOut className="h-4 w-4 text-muted-foreground" />
                 <Slider
                   value={[zoom]}
                   min={1}
                   max={3}
                   step={0.1}
                   onValueChange={(val) => setZoom(val[0])}
                   className="flex-1"
                 />
                 <ZoomIn className="h-4 w-4 text-muted-foreground" />
               </div>
             </div>
             <Button 
               variant="outline" 
               size="sm" 
               onClick={reset}
               className="h-12 px-3 border-dashed hover:border-gold hover:text-gold transition-colors flex flex-col gap-1"
             >
               <RotateCcw className="h-3.5 w-3.5" />
               <span className="text-[9px] font-bold uppercase">Reset</span>
             </Button>
           </div>
         <DialogFooter>
           <Button variant="outline" onClick={onCancel}>Cancelar</Button>
           {onApplyToAll && (
             <Button 
               variant="secondary" 
               onClick={() => onApplyToAll(croppedAreaPixels)}
               className="bg-emerald-600 text-white hover:bg-emerald-700 border-none"
             >
               Aplicar a todas
             </Button>
           )}
           <Button onClick={handleCrop} className="bg-gold text-emerald-deep hover:bg-gold/90 border-none">
             Finalizar e Subir
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }