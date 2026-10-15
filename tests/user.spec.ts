import { test, expect } from 'playwright-test-coverage';
import { basicInit } from './basicInit';

test('updateUser', async ({ page }) => {
  //Register new user with random email
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  //Enter diner dashboard
  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  //Test edit page
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza diner');
  //Update user name
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  //Testing changes stay after logout
  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
    
});

test('updatePasswordAndEmail', async ({ page }) => {
  //Register new user with random email
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  //Enter diner dashboard
  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  //Test edit Password
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza diner');
  //Update user name
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');

  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill('test@jwt.com');

  await page.locator('#password').click();
  await page.locator('#password').fill('test1');
  await page.locator('#password').press('Enter');
  await page.getByRole('button', { name: 'Update' }).click();
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill('test@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test1');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
    
});

test('updateAsFranchisee', async ({ page }) => {
  await basicInit(page);
  await page.route('**/api/user/2', async (route) => {
    const request = route.request();
    expect(request.method()).toBe('PUT');
    expect(request.postDataJSON()).toMatchObject({
      id: '2',
      name: 'pizza franchisee updated',
      email: 'f@jwt.com',
      roles: [{ role: 'franchisee' }],
    });
    await route.fulfill({
      json: { user: request.postDataJSON(), token: 'updated-token' },
    });
  });

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('f@jwt.com');
  await page.getByPlaceholder('Password').fill('franchisee');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/diner-dashboard');

  await expect(page.getByRole('main')).toContainText('pizza franchisee');
  await page.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').first().fill('pizza franchisee updated');
  await dialog.getByRole('button', { name: 'Update' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main')).toContainText('pizza franchisee updated');
});

test('updateAsAdmin', async ({ page }) => {
  await basicInit(page);
  await page.route('**/api/user/1', async (route) => {
    const request = route.request();
    expect(request.method()).toBe('PUT');
    expect(request.postDataJSON()).toMatchObject({
      id: '1',
      name: 'pizza admin updated',
      email: 'a@jwt.com',
      roles: [{ role: 'admin' }],
    });
    await route.fulfill({
      json: { user: request.postDataJSON(), token: 'updated-token' },
    });
  });

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/diner-dashboard');

  await expect(page.getByRole('main')).toContainText('admin');
  await page.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').first().fill('pizza admin updated');
  await dialog.getByRole('button', { name: 'Update' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main')).toContainText('pizza admin updated');
});

test('listUsersAsAdmin', async ({ page }) => {
  await basicInit(page);
  await page.route(/\/api\/user(\?.*)?$/, async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({
      json: {
        users: [
          { id: '1', name: 'pizza admin', email: 'a@jwt.com', roles: [{ role: 'admin' }] },
          { id: '2', name: 'pizza franchisee', email: 'f@jwt.com', roles: [{ role: 'franchisee' }] },
        ],
        more: false,
      },
    });
  });

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: 'Users' }).click();
  await expect(page.getByRole('main')).toContainText('User List');
});
