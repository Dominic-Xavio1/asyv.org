export function getProfileImageSrc(img) {
  if (!img) return null;
  if (typeof img !== 'string') return null;
  // already an absolute or root-relative URL
  if (img.startsWith('/') || img.startsWith('http')) return img;
  // some records may include uploads path without leading slash
  if (img.includes('uploads')) return img.startsWith('/') ? img : `/${img}`;
  // handle profile folders
  if (img.startsWith('profiles') || img.startsWith('profile')) return `/uploads/${img}`;
  // fallback to profiles folder
  return `/uploads/profiles/${img}`;
}
