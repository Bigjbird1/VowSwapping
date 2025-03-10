import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse the FormData
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') as string || 'vowswap';
    
    // Check if file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      );
    }
    
    // Check file type
    if (file instanceof File) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'Unsupported file type. Only JPEG, PNG, GIF, and WebP images are allowed.' }, 
          { status: 400 }
        );
      }
      
      // Convert file to base64 for Cloudinary
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
      
      try {
        // Upload to Cloudinary
        const result = await uploadImage(base64Image, folder);
        
        return NextResponse.json({ 
          success: true, 
          url: result.url,
          publicId: result.publicId
        }, { status: 200 });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return NextResponse.json(
          { error: 'Failed to upload image to Cloudinary', details: (cloudinaryError as Error).message }, 
          { status: 500 }
        );
      }
    } else {
      // Handle case where file is a string (base64)
      const image = file as string;
      
      // Validate base64 image
      if (!image.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid image format' }, 
          { status: 400 }
        );
      }
      
      try {
        // Upload to Cloudinary
        const result = await uploadImage(image, folder);
        
        return NextResponse.json({ 
          success: true, 
          url: result.url,
          publicId: result.publicId
        }, { status: 200 });
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        return NextResponse.json(
          { error: 'Failed to upload image to Cloudinary', details: (cloudinaryError as Error).message }, 
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image to Cloudinary', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}
