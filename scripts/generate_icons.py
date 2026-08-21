from PIL import Image
import os

def generate_icons():
    source_path = '/home/ubuntu/nmis-frontend-authoritative/public/assets/odchc-seal.png'
    public_dir = '/home/ubuntu/nmis-frontend-authoritative/public'
    
    if not os.path.exists(source_path):
        print(f"Source image not found: {source_path}")
        return

    img = Image.open(source_path)
    
    # Create a square crop
    width, height = img.size
    min_dim = min(width, height)
    left = (width - min_dim) / 2
    top = (height - min_dim) / 2
    right = (width + min_dim) / 2
    bottom = (height + min_dim) / 2
    
    square_img = img.crop((left, top, right, bottom))
    
    # Define sizes
    sizes = {
        'favicon.ico': (32, 32),
        'apple-touch-icon.png': (180, 180),
        'android-chrome-192x192.png': (192, 192),
        'android-chrome-512x512.png': (512, 512)
    }
    
    for filename, size in sizes.items():
        resized = square_img.resize(size, Image.Resampling.LANCZOS)
        out_path = os.path.join(public_dir, filename)
        
        # Save as ICO for favicon, PNG for others
        if filename.endswith('.ico'):
            resized.save(out_path, format='ICO')
        else:
            resized.save(out_path, format='PNG')
        print(f"Generated: {out_path} ({size[0]}x{size[1]})")

if __name__ == "__main__":
    generate_icons()
