import { useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
// Import the new multiple upload function
import { uploadMultipleImages } from "../../utils/uploadService";

interface ImageDropzoneProps {
    // The prop now expects an array of strings!
    onUploadComplete: (imageUrls: string[]) => void;
}

export default function ImageDropzone({ onUploadComplete }: ImageDropzoneProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Convert FileList to a standard Array
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsUploading(true);

        // Call your shared service to upload them all simultaneously
        const newUrls = await uploadMultipleImages(files);
        
        if (newUrls.length > 0) {
            // Combine previously uploaded images with the new ones
            const combinedUrls = [...uploadedUrls, ...newUrls];
            setUploadedUrls(combinedUrls);
            onUploadComplete(combinedUrls); // Pass the array to the parent form
        } else {
            alert("Failed to upload images. Please try again.");
        }
        
        setIsUploading(false);
        // Reset the input so the user can select more files if they want
        e.target.value = '';
    };

    const handleRemove = (urlToRemove: string) => {
        // Filter out the image the user wants to delete
        const filteredUrls = uploadedUrls.filter(url => url !== urlToRemove);
        setUploadedUrls(filteredUrls);
        onUploadComplete(filteredUrls); 
    };

    return (
        <div className="w-full space-y-3">
            {/* 1. The Previews Grid */}
            {uploadedUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedUrls.map((url, index) => (
                        <div key={index} className="relative w-full h-24 rounded-xl overflow-hidden ring-1 ring-slate-200 group">
                            <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => handleRemove(url)} 
                                className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full hover:bg-red-600 shadow-sm backdrop-blur-sm transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 2. The Upload Dropzone */}
            <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-emerald-50 hover:border-emerald-400 transition-colors bg-slate-50 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                        <Loader2 className="w-6 h-6 mb-2 text-emerald-500 animate-spin" />
                    ) : (
                        <UploadCloud className="w-6 h-6 mb-2 text-slate-400" />
                    )}
                    <p className="text-xs font-medium text-slate-500">
                        {isUploading ? "Uploading to Cloud..." : "Click to add photos"}
                    </p>
                </div>
                <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple // <-- Crucial: Allows selecting multiple files in the OS dialog
                    onChange={handleFileSelect} 
                    disabled={isUploading} 
                />
            </label>
        </div>
    );
}