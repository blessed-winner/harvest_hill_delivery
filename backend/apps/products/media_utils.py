import os
import logging
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp'}


def sync_existing_media():
    """
    Scans MEDIA_ROOT and existing Product / ProductImage models to index all
    stored images into the MediaAsset library without creating duplicate files.
    """
    from .models import MediaAsset, Product, ProductImage

    added_count = 0
    media_root = getattr(settings, 'MEDIA_ROOT', None)
    if not media_root or not os.path.exists(media_root):
        return 0, MediaAsset.objects.count()

    existing_files = set(MediaAsset.objects.values_list('file', flat=True))

    # 1. Walk media directories: products, products/gallery, media_library
    for root, _, files in os.walk(media_root):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext not in IMAGE_EXTENSIONS:
                continue

            full_path = os.path.join(root, f)
            try:
                rel_path = os.path.relpath(full_path, media_root).replace('\\', '/')
            except ValueError:
                continue

            if rel_path in existing_files:
                continue

            try:
                size = os.path.getsize(full_path)
            except OSError:
                size = 0

            clean_filename = f.split('_', 1)[-1] if len(f) > 30 and '_' in f else f
            asset = MediaAsset.objects.create(
                file=rel_path,
                original_filename=clean_filename,
                file_size=size
            )
            existing_files.add(rel_path)
            added_count += 1

    # 2. Check ProductImage references in DB
    for pi in ProductImage.objects.exclude(image='').iterator():
        if not pi.image:
            continue
        rel_path = pi.image.name.replace('\\', '/')
        if rel_path not in existing_files:
            size = 0
            try:
                if pi.image.storage.exists(rel_path):
                    size = pi.image.storage.size(rel_path)
            except Exception:
                pass
            fname = os.path.basename(rel_path)
            clean_filename = fname.split('_', 1)[-1] if len(fname) > 30 and '_' in fname else fname
            MediaAsset.objects.create(
                file=rel_path,
                original_filename=clean_filename,
                file_size=size
            )
            existing_files.add(rel_path)
            added_count += 1

    # 3. Check Product cover image references in DB
    for prod in Product.objects.exclude(image='').iterator():
        if not prod.image:
            continue
        rel_path = prod.image.name.replace('\\', '/')
        if rel_path not in existing_files:
            size = 0
            try:
                if prod.image.storage.exists(rel_path):
                    size = prod.image.storage.size(rel_path)
            except Exception:
                pass
            fname = os.path.basename(rel_path)
            clean_filename = fname.split('_', 1)[-1] if len(fname) > 30 and '_' in fname else fname
            MediaAsset.objects.create(
                file=rel_path,
                original_filename=clean_filename,
                file_size=size
            )
            existing_files.add(rel_path)
            added_count += 1

    total_count = MediaAsset.objects.count()
    return added_count, total_count


def get_media_asset_usage(asset):
    """
    Returns the list of Products using this MediaAsset (either as cover image or gallery image).
    """
    from .models import Product

    if not asset or not asset.file:
        return []

    rel_name = asset.file.name.replace('\\', '/')
    base_name = rel_name.rsplit('/', 1)[-1].lower()

    # Match by exact path, or base filename
    products_cover = Product.objects.filter(
        image=rel_name
    ).exclude(status='archived').distinct()

    products_gallery = Product.objects.filter(
        gallery_images__image=rel_name
    ).exclude(status='archived').distinct()

    all_prods = (products_cover | products_gallery).distinct()
    return list(all_prods)
