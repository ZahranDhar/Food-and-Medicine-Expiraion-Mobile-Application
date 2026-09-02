const fs = require('fs');

async function testNodeUpload() {
  console.log('=== STEP 8: TESTING BACKEND MULTIPART UPLOAD VIA NODE CLIENT ===\n');

  // 1. Signup fresh user
  const email = 'testnode_' + Date.now() + '@example.com';
  const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'nodeuser_' + Date.now(),
      firstName: 'Node',
      lastName: 'Tester',
      email: email,
      password: 'password123'
    })
  }).then(r => r.json());

  const token = signupRes.token;
  console.log('1. Auth Token:', token ? '✅ PASS' : '❌ FAIL');

  // 2. Load small images (< 500 KB)
  const labelPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_milk_label_1786286026824.png';
  const productPath = 'C:\\Users\\Zahran\\.gemini\\antigravity-ide\\brain\\568dcca5-d75d-4729-af0d-140f683c8bef\\test_no_expiry_image_1786286040062.png';

  const labelBuffer = fs.readFileSync(labelPath);
  const productBuffer = fs.readFileSync(productPath);

  console.log(`Label image size: ${(labelBuffer.length / 1024).toFixed(1)} KB`);
  console.log(`Product image size: ${(productBuffer.length / 1024).toFixed(1)} KB`);

  // 3. Post to /api/products
  const prodForm = new FormData();
  prodForm.append('labelImage', new Blob([labelBuffer], { type: 'image/png' }), 'label.png');
  prodForm.append('productImage', new Blob([productBuffer], { type: 'image/png' }), 'product.png');
  prodForm.append('title', 'Node Small Image Milk');
  prodForm.append('category', 'Dairy');

  const res = await fetch('http://localhost:3000/api/products', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: prodForm
  });

  const data = await res.json();
  console.log('\n2. Node Client POST /api/products Status:', res.status);
  console.log('   Response Data:', JSON.stringify(data, null, 2));

  if (data.product?._id) {
    await fetch('http://localhost:3000/api/products/' + data.product._id, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('Cleaned up test product.');
  }

  console.log('\n=== NODE BACKEND UPLOAD TEST COMPLETED ===');
}

testNodeUpload().catch(console.error);
