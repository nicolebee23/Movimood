#!/usr/bin/env python3
"""
Generate cinematographic genre poster images for MoviMood
Creates landscape (16:9) images with thematic colors and gradients for each genre
"""

from PIL import Image, ImageDraw, ImageFilter
import os
from pathlib import Path

# Dimensions: 16:9 aspect ratio (800x450 for high quality)
WIDTH = 800
HEIGHT = 450

# Genre configurations with thematic colors and descriptions
genres_config = {
    'aventura': {
        'colors': [(255, 140, 0), (255, 215, 0), (139, 69, 19)],  # Orange, Gold, Brown
        'description': 'Adventure landscapes and exploration'
    },
    'animacion': {
        'colors': [(255, 105, 180), (138, 43, 226), (0, 191, 255)],  # Pink, Blue Violet, DeepSkyBlue
        'description': 'Colorful and vibrant animation style'
    },
    'comedia': {
        'colors': [(255, 215, 0), (255, 165, 0), (255, 69, 0)],  # Gold, Orange, Red-Orange
        'description': 'Bright and cheerful comedy'
    },
    'crimen': {
        'colors': [(47, 47, 47), (105, 105, 105), (169, 169, 169)],  # Dark Gray series
        'description': 'Dark noir crime atmosphere'
    },
    'drama': {
        'colors': [(178, 34, 34), (139, 0, 0), (105, 105, 105)],  # Dark Red, Maroon, Gray
        'description': 'Deep emotional drama'
    },
    'familia': {
        'colors': [(255, 192, 203), (255, 160, 122), (240, 255, 240)],  # Pink, Salmon, Honeydew
        'description': 'Warm and welcoming family content'
    },
    'fantasia': {
        'colors': [(138, 43, 226), (75, 0, 130), (0, 0, 255)],  # Blue Violet, Indigo, Blue
        'description': 'Magical fantasy worlds'
    },
    'terror': {
        'colors': [(50, 50, 50), (139, 0, 0), (0, 0, 0)],  # Near Black, Dark Red, Black
        'description': 'Dark horror atmosphere'
    },
    'musical': {
        'colors': [(255, 215, 0), (220, 20, 60), (138, 43, 226)],  # Gold, Crimson, Blue Violet
        'description': 'Vibrant musical performances'
    },
    'misterio': {
        'colors': [(47, 47, 47), (128, 128, 128), (72, 61, 139)],  # Dark Gray, Gray, DarkSlateBlue
        'description': 'Mysterious and suspenseful'
    },
    'romance': {
        'colors': [(255, 20, 147), (199, 21, 133), (255, 105, 180)],  # Deep Pink, Crimson, Hot Pink
        'description': 'Romantic and emotional'
    },
    'ciencia-ficcion': {
        'colors': [(0, 191, 255), (0, 128, 128), (25, 25, 112)],  # Deep Sky Blue, Teal, Midnight Blue
        'description': 'Futuristic sci-fi aesthetic'
    },
    'thriller': {
        'colors': [(178, 34, 34), (47, 47, 47), (105, 105, 105)],  # Firebrick, Dark Gray, Gray
        'description': 'Intense thriller atmosphere'
    },
    'belica': {
        'colors': [(101, 67, 33), (128, 128, 0), (105, 105, 105)],  # Brown, Olive, Gray
        'description': 'Military and warfare themes'
    },
    'western': {
        'colors': [(139, 69, 19), (205, 133, 63), (210, 180, 140)],  # Saddle Brown, Peru, Tan
        'description': 'Classic western landscape'
    }
}

def create_genre_image(genre_name, colors, output_path):
    """
    Create a cinematographic poster image for a genre
    """
    # Create base image with gradient background
    img = Image.new('RGB', (WIDTH, HEIGHT), colors[0])
    pixels = img.load()
    
    # Create gradient from left to right
    for x in range(WIDTH):
        # Interpolate between first two colors
        progress = x / WIDTH
        r = int(colors[0][0] * (1 - progress) + colors[1][0] * progress)
        g = int(colors[0][1] * (1 - progress) + colors[1][1] * progress)
        b = int(colors[0][2] * (1 - progress) + colors[1][2] * progress)
        
        for y in range(HEIGHT):
            # Add vertical variation with third color
            y_progress = y / HEIGHT
            r_final = int(r * (1 - y_progress * 0.3) + colors[2][0] * y_progress * 0.3)
            g_final = int(g * (1 - y_progress * 0.3) + colors[2][1] * y_progress * 0.3)
            b_final = int(b * (1 - y_progress * 0.3) + colors[2][2] * y_progress * 0.3)
            pixels[x, y] = (r_final, g_final, b_final)
    
    # Add some texture/noise for cinematic feel
    draw = ImageDraw.Draw(img, 'RGBA')
    for _ in range(200):
        import random
        x = random.randint(0, WIDTH - 1)
        y = random.randint(0, HEIGHT - 1)
        size = random.randint(1, 3)
        opacity = random.randint(5, 25)
        draw.rectangle(
            [x, y, x + size, y + size],
            fill=(255, 255, 255, opacity)
        )
    
    # Add subtle vignette (darkened edges)
    vignette = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)
    for i in range(50):
        alpha = int(100 * (i / 50))
        vignette_draw.rectangle(
            [i, i, WIDTH - i, HEIGHT - i],
            outline=(0, 0, 0, alpha)
        )
    
    img = Image.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')
    
    # Apply slight blur for cinematic smoothness
    img = img.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # Save image
    img.save(output_path, 'PNG', quality=95)
    print(f"✓ Generated: {os.path.basename(output_path)}")

def main():
    """Generate all genre images"""
    assets_dir = Path('src/assets')
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    print("🎬 Generating cinematographic genre images...")
    print(f"   Output: {assets_dir}")
    print(f"   Format: PNG ({WIDTH}x{HEIGHT}, 16:9 aspect ratio)")
    print()
    
    for genre, config in genres_config.items():
        filename = f'genero-{genre}.png'
        output_path = assets_dir / filename
        create_genre_image(genre, config['colors'], str(output_path))
    
    print()
    print("✓ All 15 genre images generated successfully!")
    print(f"   Total images: {len(genres_config)}")
    print(f"   Location: {assets_dir}")

if __name__ == '__main__':
    main()
