import base64
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.products.models import Product, ProductImage

# 1x1 transparent PNG (file contents are irrelevant here, only the upload names matter)
PNG_BYTES = base64.b64decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
)

TEST_MEDIA_ROOT = tempfile.mkdtemp(prefix='harvesthill-test-media-')


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class SameBaseNameGalleryImagesTestCase(TestCase):
    """Gallery images that only differ by extension must never be collapsed into one."""

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.api = APIClient()
        self.admin = User.objects.create_user(
            username='catalog_admin',
            email='catalog_admin@harvesthill.rw',
            password='Password123!',
            role='admin',
        )
        self.api.force_authenticate(user=self.admin)

    def test_two_uploads_sharing_base_name_are_both_returned(self):
        response = self.api.post(
            '/api/products/',
            {
                'name': 'Milk',
                'category': 'Animal-Based',
                'unit': 'litre',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '900.00',
                'base_price': '900.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('milk.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('milk.webp', PNG_BYTES, content_type='image/webp'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, getattr(response, 'data', None))

        product = Product.objects.get(pk=response.data['id'])

        # Both uploads must have been stored as separate gallery images.
        self.assertEqual(ProductImage.objects.filter(product=product).count(), 2)
        self.assertEqual(
            sorted(img.image.name.rsplit('/', 1)[-1] for img in product.gallery_images.all()),
            ['milk.png', 'milk.webp'],
        )

        # ...and both must be exposed by the API, not de-duplicated away.
        detail = self.api.get(f'/api/products/{product.id}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

        returned_names = sorted(url.rsplit('/', 1)[-1] for url in detail.data['images'])
        self.assertEqual(returned_names, ['milk.png', 'milk.webp'])

    def test_same_image_url_is_still_de_duplicated(self):
        """The cover image is copied from the first upload, so it must appear only once."""
        response = self.api.post(
            '/api/products/',
            {
                'name': 'Yoghurt',
                'category': 'Animal-Based',
                'unit': 'litre',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '1500.00',
                'base_price': '1500.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('yoghurt.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, getattr(response, 'data', None))

        product = Product.objects.get(pk=response.data['id'])
        detail = self.api.get(f'/api/products/{product.id}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail.data['images']), 1)
