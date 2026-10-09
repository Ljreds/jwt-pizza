import { expect, type Page } from '@playwright/test';
import type { Franchise, FranchiseList, Role, User } from '../src/service/pizzaService';

export async function basicInit(page: Page): Promise<void> {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': {
      id: '3',
      name: 'pizza diner',
      email: 'd@jwt.com',
      password: 'diner',
      roles: [{ role: 'diner' as Role.Diner }],
    },
    'f@jwt.com': {
      id: '2',
      name: 'pizza franchisee',
      email: 'f@jwt.com',
      password: 'franchisee',
      roles: [{ role: 'franchisee' as Role.Franchisee }],
    },
    'a@jwt.com': {
      id: '1',
      name: '',
      email: 'a@jwt.com',
      password: 'admin',
      roles: [{ role: 'admin' as Role.Admin }],
    }
  };

  await page.route('**/api/auth', async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === 'PUT') {
      const loginReq = request.postDataJSON();
      const user = validUsers[loginReq.email];

      if (!user || user.password !== loginReq.password) {
        await route.fulfill({
          status: 401,
          json: { message: 'Invalid email or password' },
        });
        return;
      }

      loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      };
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      return;
    }

    if (method === 'POST') {
      expect(request.postDataJSON()).toMatchObject({
        name: 'Test User',
        email: 'r@jwt.com',
        password: 'test',
      });
      const registeredEmail = 'r@jwt.com';
      const user: User = {
        id: '5',
        name: 'Test User',
        email: registeredEmail,
        password: 'test',
        roles: [{ role: 'diner' as Role.Diner }],
      };
      validUsers[registeredEmail] = user;
      loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
      };
      await route.fulfill({ json: { user: loggedInUser, token: 'abcdef' } });
      return;
    }

    expect(method).toBe('DELETE');
    loggedInUser = undefined;
    await route.fulfill({ json: {} });
  });

  await page.route('**/api/order/menu', async (route) => {
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

  const pizzaPocket: Franchise = {
    id: '1',
    name: 'pizzaPocket',
    admins: [{ id: '2', name: 'pizza franchisee', email: 'f@jwt.com' }],
    stores: [{ id: '1', name: 'SLC', totalRevenue: 0.0808 }],
  };
  const franchiseRes: FranchiseList = {
    franchises: [
      { id: '2', name: 'Pizza pie', stores: [] },
      pizzaPocket,
    ],
    more: false,
  };

  await page.route(/\/api\/franchise(?:\/.*)?(?:\?.*)?$/, async (route) => {
    const request = route.request();
    const method = request.method();
    const pathname = new URL(request.url()).pathname;

    if (method === 'GET') {
      const isFranchiseDetail = /^\/api\/franchise\/[^/]+$/.test(pathname);
      await route.fulfill({
        json: isFranchiseDetail
          ? franchiseRes.franchises.includes(pizzaPocket)
            ? [pizzaPocket]
            : []
          : franchiseRes,
      });
      return;
    }

    if (method === 'POST') {
      expect(pathname).toBe('/api/franchise');
      const franchiseRequest = request.postDataJSON();
      expect(franchiseRequest).toMatchObject({
        stores: [],
        id: '',
        name: 'testPizza',
        admins: [{ email: 't@jwt.com' }],
      });
      const franchise: Franchise = {
        ...franchiseRequest,
        id: '3',
        admins: [{ email: 't@jwt.com', name: 'Test User' }],
        stores: [],
      };
      franchiseRes.franchises.push(franchise);
      await route.fulfill({ json: franchise });
      return;
    }

    expect(method).toBe('DELETE');
    const franchiseMatch = pathname.match(/^\/api\/franchise\/([^/]+)$/);
    expect(franchiseMatch).not.toBeNull();
    if (!franchiseMatch) {
      throw new Error(`Unexpected franchise DELETE path: ${pathname}`);
    }
    franchiseRes.franchises = franchiseRes.franchises.filter((franchise) => franchise.id !== franchiseMatch[1]);
    await route.fulfill({ json: null });
  });

  await page.route(/\/api\/franchise\/[^/]+\/store$/, async (route) => {
    const request = route.request();
    expect(request.method()).toBe('POST');
    expect(request.postDataJSON()).toMatchObject({ id: '', name: 'Provo' });
    const pathname = new URL(request.url()).pathname;
    const franchiseMatch = pathname.match(/^\/api\/franchise\/([^/]+)\/store$/);
    expect(franchiseMatch).not.toBeNull();
    if (!franchiseMatch) {
      throw new Error(`Unexpected store POST path: ${pathname}`);
    }
    const franchise = franchiseRes.franchises.find((item) => item.id === franchiseMatch[1]);
    if (!franchise) {
      throw new Error(`Franchise ${franchiseMatch[1]} was not found`);
    }
    const store = { id: '53', name: 'Provo', totalRevenue: 0 };
    franchise.stores.push(store);
    await route.fulfill({ json: store });
  });

  await page.route(/\/api\/franchise\/[^/]+\/store\/[^/]+$/, async (route) => {
    const request = route.request();
    expect(request.method()).toBe('DELETE');
    const pathname = new URL(request.url()).pathname;
    const storeMatch = pathname.match(/^\/api\/franchise\/([^/]+)\/store\/([^/]+)$/);
    expect(storeMatch).not.toBeNull();
    if (!storeMatch) {
      throw new Error(`Unexpected store DELETE path: ${pathname}`);
    }
    const [, franchiseId, storeId] = storeMatch;
    const franchise = franchiseRes.franchises.find((item) => item.id === franchiseId);
    if (franchise) {
      franchise.stores = franchise.stores.filter((store) => store.id !== storeId);
    }
    await route.fulfill({ json: null });
  });

  await page.route('**/api/order', async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      await route.fulfill({
        json: {
          id: '3',
          dinerId: loggedInUser?.id ?? '3',
          orders: [],
        },
      });
      return;
    }

    expect(method).toBe('POST');
    const orderReq = {
      items: [
        { menuId: 2, description: 'Pepperoni', price: 0.0042 },
        { menuId: 1, description: 'Veggie', price: 0.0038 },
      ],
      storeId: '1',
      franchiseId: '1',
    };
    const orderRes = {
      order: {
        items: [
          { menuId: 2, description: 'Pepperoni', price: 0.0042 },
          { menuId: 1, description: 'Veggie', price: 0.0038 },
        ],
        storeId: '1',
        franchiseId:'1',
        id: 61,
      },
      jwt: 'abcdefg',
    };
    expect(route.request().postDataJSON()).toMatchObject(orderReq);
    await route.fulfill({ json: orderRes });
  });

  await page.route('**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');

    if (!loggedInUser) {
      await route.fulfill({
        status: 401,
        json: { message: 'Not authenticated' },
      });
      return;
    }

    await route.fulfill({ json: loggedInUser });
  });

  await page.goto('/');

}
