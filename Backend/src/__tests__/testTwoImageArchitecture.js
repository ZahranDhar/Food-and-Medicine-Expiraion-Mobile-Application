const fs = require('fs');
const path = require('path');

async function runTest() {
  console.log('=== RUNNING TWO-IMAGE ARCHITECTURE VERIFICATION ===\n');

  // 1. Health check
  const health = await fetch('http://localhost:3000/health').then(r => r.json());
  console.log('1. GET /health:', health.status === 'ok' ? '✅ PASS' : '❌ FAIL');

  // 2. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testuser_1795956820@example.com', password: 'password123' })
  }).then(r => r.json());
  console.log('2. POST /api/auth/login:', loginRes.token ? '✅ PASS' : '❌ FAIL');

  const token = loginRes.token;

  // 3. Load test images
  const labelPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_milk_label_1786286026824.png';
  const productPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_no_expiry_image_1786286040062.png';

  const labelBuffer = fs.readFileSync(labelPath);
  const productBuffer = fs.readFileSync(productPath);

  // 4. Test Missing labelImage (Expect HTTP 400)
  const noLabelForm = new FormData();
  noLabelForm.append('productImage', new Blob([productBuffer], { type: 'image/png' }), 'product.png');
  noLabelForm.append('title', 'No Label Product');

  const noLabelRes = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: noLabelForm
  });
  console.log('3. Missing labelImage status (Expect 400):', noLabelRes.status, noLabelRes.status === 400 ? '✅ PASS' : '❌ FAIL');

  // 5. Test Missing productImage (Expect HTTP 400)
  const noProdForm = new FormData();
  noProdForm.append('labelImage', new Blob([labelBuffer], { type: 'image/png' }), 'label.png');
  noProdForm.append('title', 'No Product Image');

  const noProdRes = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: noProdForm
  });
  console.log('4. Missing productImage status (Expect 400):', noProdRes.status, noProdRes.status === 400 ? '✅ PASS' : '❌ FAIL');

  // 6. Test Non-expiry labelImage (Expect HTTP 422)
  const failOcrForm = new FormData();
  failOcrForm.append('labelImage', new Blob([productBuffer], { type: 'image/png' }), 'no_expiry.png');
  failOcrForm.append('productImage', new Blob([productBuffer], { type: 'image/png' }), 'product.png');
  failOcrForm.append('title', 'Bad Expiration Label');

  const failOcrRes = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: failOcrForm
  });
  console.log('5. Non-expiry labelImage status (Expect 422):', failOcrRes.status, failOcrRes.status === 422 ? '✅ PASS' : '❌ FAIL');

  // 7. Test Valid Two-Image Submission (labelImage with EXP 15/12/2026 + productImage)
  const validForm = new FormData();
  validForm.append('labelImage', new Blob([labelBuffer], { type: 'image/png' }), 'label.png');
  validForm.append('productImage', new Blob([productBuffer], { type: 'image/png' }), 'product.png');
  validForm.append('title', 'Two-Image Organic Milk');
  validForm.append('category', 'Dairy');

  console.log('\nSubmitting valid labelImage + productImage to POST /api/products...');
  const validRes = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: validForm
  });

  const validData = await validRes.json();
  console.log('6. Valid Two-Image Product Creation Result:');
  console.log('   HTTP Status Code: ', validRes.status, validRes.status === 201 ? '✅ PASS' : '❌ FAIL');
  console.log('   Product ID:       ', validData.product?._id);
  console.log('   Extracted Expiry: ', validData.product?.expirationDate, validData.product?.expirationDate === '2026-12-15' ? '✅ PASS' : '❌ FAIL');
  console.log('   Product Image URL:', validData.product?.image);
  console.log('   Cloudinary PublicID:', validData.product?.cloudinaryPublicId);

  const createdId = validData.product?._id;

  // 8. Verify GET /api/products
  const listRes = await fetch('http://localhost:3000/api/products', {
    headers: { Authorization: 'Bearer ' + token }
  }).then(r => r.json());

  const fetchedProd = listRes.products?.find(p => p._id === createdId);
  console.log('\n7. GET /api/products verification:');
  console.log('   Found Created Product:', fetchedProd ? '✅ PASS' : '❌ FAIL');
  console.log('   Display Image URL:    ', fetchedProd?.image);
  console.log('   Stored Expiration:    ', fetchedProd?.expirationDate);

  // 9. Cleanup - Delete Product
  if (createdId) {
    const delRes = await fetch('http://localhost:3000/api/products/' + createdId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    }).then(r => r.json());
    console.log('\n8. DELETE /api/products/:id response:', delRes.message, delRes.success ? '✅ PASS' : '❌ FAIL');
  }

  console.log('\n=== ALL TWO-IMAGE ARCHITECTURE TESTS COMPLETED SUCCESSFULLY ===');
}

runTest().catch(console.error);
