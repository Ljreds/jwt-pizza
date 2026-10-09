import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './basicInit';

test('home page', async ({ page }) => {
  await page.goto('/');

  expect(await page.title()).toBe('JWT Pizza');
});

test('purchase with login', async ({ page }) => {
  await basicInit(page);

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

test('login', async ({ page }) => {
  // await basicInit(page);

  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('d@jwt.com');
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();


  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByText('Your pizza kitchen')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('pizza diner');
});