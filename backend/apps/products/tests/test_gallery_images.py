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

    def test_update_product_preserves_existing_images_when_adding_new_image(self):
        """Uploading a new image to a product with 1 image preserves existing and results in 2 images."""
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Avocado',
                'category': 'Fruits',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '1000.00',
                'base_price': '1000.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('avocado_1.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        # Add 1 new image via PATCH
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'images': [
                    SimpleUploadedFile('avocado_2.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        product = Product.objects.get(pk=prod_id)
        self.assertEqual(product.gallery_images.count(), 2)
        returned_names = sorted(url.rsplit('/', 1)[-1] for url in res_update.data['images'])
        self.assertEqual(returned_names, ['avocado_1.png', 'avocado_2.png'])

    def test_update_product_preserves_two_existing_when_adding_third(self):
        """Uploading a 3rd image to a product with 2 images preserves both and results in 3 images."""
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Banana',
                'category': 'Fruits',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '800.00',
                'base_price': '800.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('banana_1.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('banana_2.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        # Add 1 new image via PATCH
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'images': [
                    SimpleUploadedFile('banana_3.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        product = Product.objects.get(pk=prod_id)
        self.assertEqual(product.gallery_images.count(), 3)
        returned_names = sorted(url.rsplit('/', 1)[-1] for url in res_update.data['images'])
        self.assertEqual(returned_names, ['banana_1.png', 'banana_2.png', 'banana_3.png'])

    def test_update_product_rejects_exceeding_three_images(self):
        """Attempting to add images that would bring the total above 3 must return 400."""
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Carrot',
                'category': 'Vegetables',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '500.00',
                'base_price': '500.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('carrot_1.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('carrot_2.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        # Attempt to add 2 new images (total would be 4)
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'images': [
                    SimpleUploadedFile('carrot_3.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('carrot_4.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_update.status_code, status.HTTP_400_BAD_REQUEST)
        errors = res_update.data.get('errors', res_update.data)
        self.assertIn('images', errors)

    def test_update_product_explicit_delete_and_replace(self):
        """Deleting 1 image and adding 1 new image retains the remaining 2 + 1 new = 3."""
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Tomato',
                'category': 'Vegetables',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '600.00',
                'base_price': '600.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('tomato_1.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('tomato_2.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('tomato_3.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        # Explicitly delete tomato_2.png and upload tomato_4.png
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'deleted_images': ['tomato_2.png'],
                'images': [
                    SimpleUploadedFile('tomato_4.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        returned_names = sorted(url.rsplit('/', 1)[-1] for url in res_update.data['images'])
        self.assertEqual(returned_names, ['tomato_1.png', 'tomato_3.png', 'tomato_4.png'])

    def test_update_product_without_images_preserves_existing(self):
        """Updating details like name/price without sending images keeps all existing images."""
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Spinach',
                'category': 'Vegetables',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '400.00',
                'base_price': '400.00',
                'status': 'open',
                'images': [
                    SimpleUploadedFile('spinach_1.png', PNG_BYTES, content_type='image/png'),
                    SimpleUploadedFile('spinach_2.png', PNG_BYTES, content_type='image/png'),
                ],
            },
            format='multipart',
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'name': 'Fresh Spinach Super',
            },
            format='multipart',
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['name'], 'Fresh Spinach Super')
        returned_names = sorted(url.rsplit('/', 1)[-1] for url in res_update.data['images'])
        self.assertEqual(returned_names, ['spinach_1.png', 'spinach_2.png'])
