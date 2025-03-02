import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { image, folder } = data;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' }, 
        { status: 400 }
      );
    }
    
    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format' }, 
        { status: 400 }
      );
    }
    
    // Upload to Cloudinary
    const result = await uploadImage(image, folder || 'vowswap');
    
    return NextResponse.json({ 
      success: true, 
      url: result.url,
      publicId: result.publicId
    });
    
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' }, 
      { status: 500 }
    );
  }
}
