import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';
import { basicInit } from './basicInit';

type MockUser = { id: string; name: string; email: string; password: string; roles: { role: string }[] };

// In-memory stand-in for the auth and user endpoints, so a registered user can be updated and logged back in
async function mockUserService(page: Page) {
  // Everything lives in memory for the duration of one test
  const users: MockUser[] = [];
  // token -> user id, so requests can be matched to the logged-in user
  const tokens = new Map<string, string>();
  let nextId = 10;

  // Never send the password back to the browser, like the real API
  const publicUser = ({ password, ...user }: MockUser) => user;
  const issueToken = (user: MockUser) => {
    const token = `token-${user.id}-${tokens.size}`;
    tokens.set(token, user.id);
    return token;
  };
  // Look up who is calling from the Authorization: Bearer <token> header
  const authedUser = (headers: Record<string, string>) => {
    const id = tokens.get((headers['authorization'] ?? '').split(' ')[1]);
    return users.find((u) => u.id === id);
  };

  await page.route('**/api/auth', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'POST') {
      const { name, email, password } = request.postDataJSON();
      const user: MockUser = { id: String(nextId++), name, email, password, roles: [{ role: 'diner' }] };
      users.push(user);
      await route.fulfill({ json: { user: publicUser(user), token: issueToken(user) } });
    } else if (method === 'PUT') {
      const { email, password } = request.postDataJSON();
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) {
        await route.fulfill({ status: 404, json: { message: 'unknown user' } });
        return;
      }
      await route.fulfill({ json: { user: publicUser(user), token: issueToken(user) } });
    } else {
      expect(method).toBe('DELETE');
      await route.fulfill({ json: { message: 'logout successful' } });
    }
  });

  await page.route('**/api/user/me', async (route) => {
    const user = authedUser(route.request().headers());
    await route.fulfill(user ? { json: publicUser(user) } : { status: 401, json: { message: 'unauthorized' } });
  });

  await page.route(/\/api\/user\/\d+$/, async (route) => {
    const request = route.request();
    expect(request.method()).toBe('PUT');
    const user = authedUser(request.headers());
    if (!user || user.id !== new URL(request.url()).pathname.split('/').pop()) {
      await route.fulfill({ status: 403, json: { message: 'unauthorized' } });
      return;
    }
    const { name, email, password } = request.postDataJSON();
    user.name = name || user.name;
    user.email = email || user.email;
    user.password = password || user.password;
    await route.fulfill({ json: { user: publicUser(user), token: issueToken(user) } });
  });

  await page.route('**/api/order', async (route) => {
    await route.fulfill({ json: { dinerId: authedUser(route.request().headers())?.id, orders: [] } });
  });
}

test('updateUser', async ({ page }) => {
  //Register new user with random email
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await mockUserService(page);
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
  await mockUserService(page);
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

  await expect(page.getByText('admin', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').first().fill('pizza admin updated');
  await dialog.getByRole('button', { name: 'Update' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('main')).toContainText('pizza admin updated');
});

// Basic check: admin clicks Users and sees the overlay with the mocked users and their roles.
test('listUsersAsAdmin', async ({ page }) => {
  await basicInit(page);
  // Mock GET /api/user with a fixed two-user list
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

  // Log in as the admin defined in basicInit, then go to the dashboard
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: 'Users' }).click();

  // The dialog is found by its accessible name, which comes from the 'User List' heading
  const dialog = page.getByRole('dialog', { name: 'User List' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('User List');

  const adminRow = dialog.getByRole('row', { name: /pizza admin/ });
  await expect(adminRow).toContainText('a@jwt.com');
  await expect(adminRow).toContainText('admin');

  const franchiseeRow = dialog.getByRole('row', { name: /pizza franchisee/ });
  await expect(franchiseeRow).toContainText('f@jwt.com');
  await expect(franchiseeRow).toContainText('franchisee');
});

// Shared setup for the paging/filter/delete tests: mocks a 13-user server, logs in as admin and opens the overlay.
// Returns the requests seen and ids deleted so tests can assert on what the UI sent.
async function openUserListAsAdmin(page: Page) {
  // Every GET /api/user URL the UI requested
  const requests: URL[] = [];
  const deletedIds: string[] = [];
  // 12 diners + 1 franchisee = 13 users, i.e. two pages at 10 per page
  const allUsers = Array.from({ length: 12 }, (_, i) => {
    const n = String(i + 1).padStart(2, '0');
    return { id: String(i + 1), name: `diner ${n}`, email: `diner${n}@jwt.com`, roles: [{ role: 'diner' }] };
  });
  allUsers.push({ id: '13', name: 'pizza franchisee', email: 'f@jwt.com', roles: [{ role: 'franchisee' }] });

  await basicInit(page);
  await page.route(/\/api\/user(\?.*)?$/, async (route) => {
    expect(route.request().method()).toBe('GET');
    const url = new URL(route.request().url());
    requests.push(url);
    // Behave like the backend: 1-based page, limit, and '*' wildcard filter on name
    const pageNum = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const nameFilter = (url.searchParams.get('name') ?? '*').replace(/\*/g, '.*');
    const matches = allUsers.filter((u) => new RegExp(`^${nameFilter}$`).test(u.name));
    // `more` is true when matches remain beyond this page
    const start = (pageNum - 1) * limit;
    await route.fulfill({ json: { users: matches.slice(start, start + limit), more: matches.length > start + limit } });
  });

  await page.route(/\/api\/user\/\d+$/, async (route) => {
    expect(route.request().method()).toBe('DELETE');
    const id = new URL(route.request().url()).pathname.split('/').pop()!;
    deletedIds.push(id);
    const index = allUsers.findIndex((u) => u.id === id);
    if (index >= 0) {
      allUsers.splice(index, 1);
    }
    await route.fulfill({ json: { message: 'user deleted' } });
  });

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByPlaceholder('Email address').fill('a@jwt.com');
  await page.getByPlaceholder('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.goto('/admin-dashboard');
  await page.getByRole('button', { name: 'Users' }).click();

  const dialog = page.getByRole('dialog', { name: 'User List' });
  await expect(dialog).toBeVisible();
  return { dialog, requests, deletedIds };
}

// Paging: page 1 shows 10 users, » loads page 2 (the last 3), « returns. Buttons disable at the ends.
test('listUsersPaging', async ({ page }) => {
  const { dialog, requests } = await openUserListAsAdmin(page);
  const previous = dialog.getByRole('button', { name: '«' });
  const next = dialog.getByRole('button', { name: '»' });

  // First page holds 10 of the 13 users
  await expect(dialog).toContainText('diner 01');
  await expect(dialog).toContainText('diner 10');
  await expect(dialog).not.toContainText('diner 11');
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(dialog).toContainText('diner 11');
  await expect(dialog).toContainText('pizza franchisee');
  await expect(dialog).not.toContainText('diner 01');
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  expect(requests[requests.length - 1].searchParams.get('page')).toBe('2');

  await previous.click();
  await expect(dialog).toContainText('diner 01');
  await expect(dialog).not.toContainText('diner 11');
  await expect(previous).toBeDisabled();
  expect(requests[requests.length - 1].searchParams.get('page')).toBe('1');
});

// Filter: typing 'franchisee' must request name=*franchisee* and show only the matching user.
test('listUsersNameFilter', async ({ page }) => {
  const { dialog, requests } = await openUserListAsAdmin(page);
  const filter = dialog.getByPlaceholder('Filter users');

  await filter.fill('franchisee');
  await dialog.getByRole('button', { name: 'Submit' }).click();

  await expect(dialog.getByRole('cell', { name: 'pizza franchisee', exact: true })).toBeVisible();
  await expect(dialog).not.toContainText('diner 01');
  expect(requests[requests.length - 1].searchParams.get('name')).toBe('*franchisee*');

  // Clearing the filter lists everyone again
  await filter.fill('');
  await dialog.getByRole('button', { name: 'Submit' }).click();
  await expect(dialog).toContainText('diner 01');
  await expect(dialog).not.toContainText('pizza franchisee');
});

// Delete: needs a confirm step; Cancel sends nothing, Confirm sends exactly one DELETE for that user.
test('deleteUser', async ({ page }) => {
  const { dialog, deletedIds } = await openUserListAsAdmin(page);
  const row = dialog.getByRole('row', { name: /diner 02/ });
  const confirmation = dialog.getByRole('alert');

  // Delete asks for confirmation first, and cancelling deletes nothing
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(confirmation).toContainText('Delete user diner 02');
  await confirmation.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirmation).toHaveCount(0);
  await expect(row).toBeVisible();
  expect(deletedIds).toEqual([]);

  // Confirming sends the delete and refreshes the list
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(confirmation).toContainText('diner02@jwt.com');
  expect(deletedIds).toEqual([]);
  await confirmation.getByRole('button', { name: 'Confirm' }).click();

  await expect.poll(() => deletedIds).toEqual(['2']);
  await expect(confirmation).toHaveCount(0);
  await expect(dialog.getByRole('row', { name: /diner 02/ })).toHaveCount(0);
  await expect(dialog).toContainText('diner 01');
  await expect(dialog).toContainText('diner 03');
});
