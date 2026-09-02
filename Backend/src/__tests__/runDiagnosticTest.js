const fs = require('fs');

async function runDiagnostics() {
  console.log('=== CONTROLLED DIAGNOSTIC TEST SUITE ===\n');

  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testuser_1795956820@example.com', password: 'password123' })
  }).then(r => r.json());

  const token = loginRes.token;
  console.log('1. Authentication Token:', token ? '✅ PASS' : '❌ FAIL');

  // 2. Load images
  const labelPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_milk_label_1786286026824.png';
  const productPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_no_expiry_image_1786286040062.png';

  const labelBuffer = fs.readFileSync(labelPath);
  const productBuffer = fs.readFileSync(productPath);

  // FIRST TEST: Upload only labelImage using POST /api/ocr/extract
  console.log('\n--- FIRST TEST: POST /api/ocr/extract ---');
  const ocrForm = new FormData();
  ocrForm.append('image', new Blob([labelBuffer], { type: 'image/png' }), 'label.png');

  const ocrRes = await fetch('http://localhost:3000/api/ocr/extract', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: ocrForm
  });

  const ocrData = await ocrRes.json();
  console.log('POST /api/ocr/extract status:', ocrRes.status, ocrRes.status === 200 ? '✅ PASS' : '❌ FAIL');
  console.log('Extracted OCR Text: ', JSON.stringify(ocrData.ocrText));
  console.log('Parsed Date:        ', ocrData.parseResult?.expirationDate);

  // SECOND TEST: Upload labelImage + productImage using POST /api/products
  console.log('\n--- SECOND TEST: POST /api/products (labelImage + productImage) ---');
  const prodForm = new FormData();
  prodForm.append('labelImage', new Blob([labelBuffer], { type: 'image/png' }), 'label.png');
  prodForm.append('productImage', new Blob([productBuffer], { type: 'image/png' }), 'product.png');
  prodForm.append('title', 'Diagnostic Organic Milk');
  prodForm.append('category', 'Dairy');

  const prodRes = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: prodForm
  });

  const prodData = await prodRes.json();
  console.log('POST /api/products status:', prodRes.status, prodRes.status === 201 ? '✅ PASS' : '❌ FAIL');
  console.log('Created Product ID:  ', prodData.product?._id);
  console.log('Product Expiration:  ', prodData.product?.expirationDate);
  console.log('Product Image URL:   ', prodData.product?.image);
  console.log('Cloudinary Public ID:', prodData.product?.cloudinaryPublicId);

  // Cleanup created product
  if (prodData.product?._id) {
    await fetch('http://localhost:3000/api/products/' + prodData.product._id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Cleaned up test product.');
  }

  console.log('\n=== DIAGNOSTIC TEST SUITE COMPLETED SUCCESSFULLY ===');
}

runDiagnostics().catch(console.error);
