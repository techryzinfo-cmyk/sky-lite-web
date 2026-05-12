const CLOUD_NAME   = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const API_KEY      = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!;
const API_SECRET   = process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET!;
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;
const FOLDER       = 'pratham_app';

async function sha1(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const timestamp = Math.round(Date.now() / 1000);
  const signatureString = `folder=${FOLDER}&timestamp=${timestamp}${API_SECRET}`;
  const signature = await sha1(signatureString);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', FOLDER);

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Cloudinary upload failed');
  }
  const data = await res.json();
  return data.secure_url as string;
}
