import logging

logger = logging.getLogger(__name__)


def delete_image_file(image_field):
    """Remove a product or supply image file from local media storage when the DB record is deleted."""
    if not image_field or not image_field.name:
        return

    # Skip remote URLs or empty strings
    if image_field.name.startswith('http://') or image_field.name.startswith('https://'):
        return

    try:
        if hasattr(image_field, 'storage') and image_field.storage.exists(image_field.name):
            image_field.storage.delete(image_field.name)
    except Exception:
        logger.exception('Failed to delete image file: %s', image_field.name)


# Backward compatibility alias
delete_cloudinary_image = delete_image_file
