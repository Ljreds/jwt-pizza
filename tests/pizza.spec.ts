import { test, expect } from './testSetup';
import { basicInit } from './basicInit';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

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

test('login', async ({ page }) => {
  await basicInit(page);

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();


  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByText('Your pizza kitchen')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('pizza diner');
});

test('franchise as non-franchise owner', async ({ page }) => {
  await basicInit(page);


  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByText('So you want a piece of the')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('If you are already a franchisee, pleaseloginusing your franchise account');
});

test('Actions of franchise owner', async ({ page }) => {
  await basicInit(page);
  // await page.goto('/');     


  await page.getByLabel('Global').getByRole('link', { name: 'Franchise' }).click();
  await page.getByRole('link', { name: 'login', exact: true }).click();

  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('pizzaPocket')).toBeVisible();
  await expect(page.getByText('Everything you need to run an')).toBeVisible();
  await page.getByRole('button', { name: 'Create store' }).click();

  await page.getByPlaceholder('store name').click();
  await page.getByPlaceholder('store name').fill('Provo');
  await expect(page.getByText('Create store')).toBeVisible();
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.locator('tbody')).toContainText('Provo');

  await page.getByRole('row', { name: 'Provo 0 ₿ Close' }).getByRole('button').click();
  await expect(page.getByText('Sorry to see you go')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

});

test('register and logout', async ({ page }) => {
  await basicInit(page);
  // await page.goto('/'); 

  await page.getByRole('link', { name: 'Register' }).click();

  await expect(page.getByText('Welcome to the party')).toBeVisible();
  await page.getByPlaceholder('Full name').fill('Test User');
  await page.getByPlaceholder('Email address').click();
  await page.getByPlaceholder('Email address').fill('r@jwt.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('test');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Logout' }).click();

});

test('create franchise', async ({ page }) => {
  await basicInit(page);
  await page.goto('/create-franchise');

  await page.getByPlaceholder('franchise name').fill('testPizza');
  await page.getByPlaceholder('franchisee admin email').fill('t@jwt.com');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
});

test('Actions of an admin', async ({ page }) => {
  //  await basicInit(page);
    await page.goto('/');
  
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByPlaceholder('Email address').fill('a@jwt.com');
    await page.getByPlaceholder('Password').click();
    await page.getByPlaceholder('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();



    await page.getByRole('link', { name: 'Admin' }).click();
    await expect(page.getByText('Mama Ricci\'s kitchen')).toBeVisible();

    await page.getByPlaceholder('Filter franchises').click();
    await page.getByPlaceholder('Filter franchises').fill('Pizza pie');
    await page.getByRole('button', { name: 'Submit' }).click();
    

    await page.getByPlaceholder('Filter franchises').click();
    await page.getByPlaceholder('Filter franchises').fill('Pizza pie');

    await expect(page.getByRole('cell', { name: 'Pizza pie', exact: true })).toBeVisible();
    await page.getByPlaceholder('Filter franchises').fill('');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('cell', { name: 'pizzaPocket', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await page.getByPlaceholder('franchise name').click();
    await page.getByPlaceholder('franchise name').fill('testPizza');
    await page.getByPlaceholder('franchisee admin email').click();
    await page.getByPlaceholder('franchisee admin email').fill('t@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('table')).toContainText('testPizza');
    await page.getByRole('row', { name: 'testPizza Test User Close' }).getByRole('button').click();
    await expect(page.getByText('Sorry to see you go')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  
});
