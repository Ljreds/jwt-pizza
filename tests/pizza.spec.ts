import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'diner' };
    const loginRes = {
      user: {
        id: 3,
        name: 'pizza diner',
        email: 'd@jwt.com',
        roles: [
          {
            role: 'diner',
          },
        ],
      },
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywibmFtZSI6InBpenphIGRpbmVyIiwiZW1haWwiOiJkQGp3dC5jb20iLCJyb2xlcyI6W3sicm9sZSI6ImRpbmVyIn1dLCJpYXQiOjE3OTE1MDIwNzZ9.vYRdzhHzvUUHbe7GGuiCXJUS7Hlqh2vWofFndRLMmD8"

    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.route('*/**/api/order/menu', async (route) => {
    const menuRes = [
      {
        id: 1,
        title: 'Veggie',
        image: 'pizza1.png',
        price: 0.0038,
        description: 'A garden of delight',
      },
      {
        id: 2,
        title: 'Pepperoni',
        image: 'pizza2.png',
        price: 0.0042,
        description: 'Spicy treat',
      },
      {
        id: 3,
        title: 'Margarita',
        image: 'pizza3.png',
        price: 0.0042,
        description: 'Essential classic',
      },
      {
        id: 4,
        title: 'Crusty',
        image: 'pizza4.png',
        price: 0.0028,
        description: 'A dry mouthed favorite',
      },
      {
        id: 5,
        title: 'Charred Leopard',
        image: 'pizza5.png',
        price: 0.0099,
        description: 'For those with a darker side',
      },
    ];
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: menuRes });
  });

  await page.route('**/api/franchise?page=0&limit=20&name=*', async (route) => {
    const franchiseRes = {
      franchises: [
        {
          id: 2,
          name: 'Pizza pie',
          stores: [],
        },
        {
          id: 1,
          name: 'pizzaPocket',
          stores: [
            {
              id: 1,
              name: 'SLC',
            },
          ],
        },
      ],
      more: false,
    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: franchiseRes });
  });

  await page.route('*/**/api/order', async (route) => {
    const orderReq = {
      items: [
        {
          menuId: 2,
          description: 'Pepperoni',
          price: 0.0042,
        },
        {
          menuId: 1,
          description: 'Veggie',
          price: 0.0038,
        },
      ],
      storeId: '1',
      franchiseId: 1,
    };
    const orderRes = {
      order: {
        items: [
          {
            menuId: 2,
            description: 'Pepperoni',
            price: 0.0042,
          },
          {
            menuId: 1,
            description: 'Veggie',
            price: 0.0038,
          },
        ],
        storeId: '1',
        franchiseId: 1,
        id: 61,
      },
      jwt: 'abcdefg',
    };
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

   await page.route('*/**/api/user/me', async (route) => {
    const meRes = {
      "id": 3,
      "name": "pizza diner",
      "email": "d@jwt.com",
      "roles": [
        {
          "role": "diner"
        }
      ],
 
     "iat": 1791502076

    };
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: meRes });
  });
 
  await page.goto('http://localhost:5173/');
  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page.getByText('Awesome is a click away')).toBeVisible();

  await expect(page.getByText('Pick your store and pizzas')).toBeVisible();
  await page.getByRole('combobox').selectOption('1');
  await page.getByRole('link', { name: 'Image Description Pepperoni' }).click();
  await page.getByRole('link', { name: 'Image Description Veggie A' }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();


  await expect(page.getByText('Welcome back')).toBeVisible();
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();


  await expect(page.locator('tbody')).toContainText('Pepperoni');
  await page.getByText('Send me those 2 pizzas right now!').click();
  await page.getByRole('button', { name: 'Pay now' }).click();


  await expect(page.getByText('Here is your JWT Pizza!')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('2');
  
});