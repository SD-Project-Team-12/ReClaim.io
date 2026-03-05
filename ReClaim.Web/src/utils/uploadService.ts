// Uploads a SINGLE image
export const uploadImageToCloud = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    formData.append("upload_preset", uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        return data.secure_url; 
        
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadImageToCloud(file));
    const results = await Promise.all(uploadPromises);
    return results.filter((url): url is string => url !== null);
};