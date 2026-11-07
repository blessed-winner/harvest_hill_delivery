import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.products.models import Product, ProductImage, MediaAsset

PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02'
    b'\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
)


class MediaLibraryTestCase(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin_media',
            email='admin_media@example.com',
            password='Password123!',
            role='admin',
        )
        self.client_user = User.objects.create_user(
            username='client_media',
            email='client_media@example.com',
            password='Password123!',
            role='client',
        )
        self.api = APIClient()
        self.api.force_authenticate(user=self.admin)

    def test_admin_can_list_media_assets(self):
        MediaAsset.objects.create(
            file='products/test_apple.png',
            original_filename='test_apple.png',
            file_size=1024
        )
        res = self.api.get('/api/media/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # Handle paginated or non-paginated results
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        self.assertTrue(any('test_apple.png' in str(item.get('original_filename', '')) for item in results))

    def test_admin_can_upload_media_asset(self):
        f = SimpleUploadedFile('library_peach.png', PNG_BYTES, content_type='image/png')
        res = self.api.post('/api/media/', {'files': [f]}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MediaAsset.objects.filter(original_filename='library_peach.png').exists())

    def test_admin_upload_rejects_exceeding_3mb(self):
        big_content = b'x' * (3 * 1024 * 1024 + 10)
        f = SimpleUploadedFile('huge.png', big_content, content_type='image/png')
        res = self.api.post('/api/media/', {'files': [f]}, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_admin_cannot_manage_media_assets(self):
        self.api.force_authenticate(user=self.client_user)
        res = self.api.get('/api/media/')
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

        f = SimpleUploadedFile('hacked.png', PNG_BYTES, content_type='image/png')
        res_post = self.api.post('/api/media/', {'files': [f]}, format='multipart')
        self.assertIn(res_post.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_product_creation_and_update_with_library_images_does_not_duplicate_files(self):
        self.api.force_authenticate(user=self.admin)
        asset = MediaAsset.objects.create(
            file='media_library/strawberries.png',
            original_filename='strawberries.png',
            file_size=5000
        )

        # 1. Create product selecting this library image
        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Organic Strawberry',
                'category': 'Fruits',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '1500.00',
                'base_price': '1500.00',
                'status': 'open',
                'library_images': [asset.file.name],
            },
            format='multipart'
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']
        product = Product.objects.get(id=prod_id)
        self.assertEqual(product.gallery_images.count(), 1)
        self.assertEqual(product.gallery_images.first().image.name, asset.file.name)

        # 2. Add another library image on update
        asset2 = MediaAsset.objects.create(
            file='media_library/strawberries_close.png',
            original_filename='strawberries_close.png',
            file_size=6000
        )
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'library_images': [asset2.file.name],
            },
            format='multipart'
        )
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.gallery_images.count(), 2)

    def test_removing_image_from_product_does_not_delete_media_asset_from_library(self):
        self.api.force_authenticate(user=self.admin)
        asset = MediaAsset.objects.create(
            file='media_library/grapes.png',
            original_filename='grapes.png',
            file_size=4000
        )

        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Green Grapes',
                'category': 'Fruits',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '2000.00',
                'base_price': '2000.00',
                'status': 'open',
                'library_images': [asset.file.name],
            },
            format='multipart'
        )
        prod_id = res_create.data['id']
        product = Product.objects.get(id=prod_id)
        pi = product.gallery_images.first()

        # Delete image from product
        res_del = self.api.post(
            f'/api/products/{prod_id}/delete_image/',
            {'image_id': str(pi.id)},
            format='json'
        )
        self.assertEqual(res_del.status_code, status.HTTP_200_OK)
        self.assertEqual(product.gallery_images.count(), 0)

        # MediaAsset must STILL exist in library!
        self.assertTrue(MediaAsset.objects.filter(id=asset.id).exists())

    def test_delete_media_asset_checks_usage_and_requires_force_if_used(self):
        self.api.force_authenticate(user=self.admin)
        asset = MediaAsset.objects.create(
            file='media_library/mango.png',
            original_filename='mango.png',
            file_size=3000
        )

        product = Product.objects.create(
            name='Sweet Mango',
            category='Fruits',
            base_price=1200,
            image=asset.file.name
        )
        ProductImage.objects.create(product=product, image=asset.file.name)

        # Attempt to delete without force -> must fail with 409
        res_del = self.api.delete(f'/api/media/{asset.id}/')
        self.assertEqual(res_del.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(res_del.data.get('can_delete', True))
        self.assertIn('products', res_del.data)

        # Delete with force=true -> must succeed and remove from product
        res_force = self.api.delete(f'/api/media/{asset.id}/?force=true')
        self.assertEqual(res_force.status_code, status.HTTP_200_OK)
        self.assertFalse(MediaAsset.objects.filter(id=asset.id).exists())
        product.refresh_from_db()
        self.assertEqual(product.gallery_images.count(), 0)

    def test_bulk_delete_media_assets(self):
        self.api.force_authenticate(user=self.admin)
        a1 = MediaAsset.objects.create(file='media_library/b1.png', original_filename='b1.png')
        a2 = MediaAsset.objects.create(file='media_library/b2.png', original_filename='b2.png')

        res = self.api.post(
            '/api/media/bulk_delete/',
            {'ids': [str(a1.id), str(a2.id)]},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(MediaAsset.objects.filter(id__in=[a1.id, a2.id]).exists())

    def test_product_update_strictly_enforces_three_images_with_library_images(self):
        self.api.force_authenticate(user=self.admin)
        a1 = MediaAsset.objects.create(file='media_library/lim1.png', original_filename='lim1.png')
        a2 = MediaAsset.objects.create(file='media_library/lim2.png', original_filename='lim2.png')
        a3 = MediaAsset.objects.create(file='media_library/lim3.png', original_filename='lim3.png')
        a4 = MediaAsset.objects.create(file='media_library/lim4.png', original_filename='lim4.png')

        res_create = self.api.post(
            '/api/products/',
            {
                'name': 'Limit Test',
                'category': 'Fruits',
                'unit': 'kg',
                'pricing_mode': 'harvest_hill_offers',
                'offered_price': '100.00',
                'base_price': '100.00',
                'status': 'open',
                'library_images': [a1.file.name, a2.file.name],
            },
            format='multipart'
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        prod_id = res_create.data['id']

        # Attempt to add 2 more library images (would be 4 total) -> 400
        res_update = self.api.patch(
            f'/api/products/{prod_id}/',
            {
                'library_images': [a3.file.name, a4.file.name],
            },
            format='multipart'
        )
        self.assertEqual(res_update.status_code, status.HTTP_400_BAD_REQUEST)
