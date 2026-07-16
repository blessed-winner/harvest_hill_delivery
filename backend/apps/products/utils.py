import logging

import cloudinary.uploader

logger = logging.getLogger(__name__)


def delete_cloudinary_image(image_field):
    """Remove a product image from Cloudinary when the DB record is deleted."""
    if not image_field or not image_field.name:
        return

    public_id = image_field.name
    if public_id.startswith('http://') or public_id.startswith('https://'):
        return

    try:
        cloudinary.uploader.destroy(public_id, resource_type='image', invalidate=True)
    except Exception:
        logger.exception('Failed to delete Cloudinary image: %s', public_id)
