import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';
import { CloseIcon, TrashIcon } from '../icons';
import { HSOverlay } from 'preline';

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({ franchises: [], more: false });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const filterFranchiseRef = React.useRef<HTMLInputElement>(null);
  // --- User list overlay state ---
  // Current page of users from the server, plus whether a next page exists.
  const [userList, setUserList] = React.useState<UserList>({ users: [], more: false });
  // User pages are 1-based (matches the backend), unlike franchises which are 0-based.
  const [userPage, setUserPage] = React.useState(1);
  // The filter actually applied to the server ('*' = everyone). Kept so the paging buttons reuse it.
  const [userFilter, setUserFilter] = React.useState('*');
  // Ref to the filter input; read only when Submit is pressed, so typing doesn't trigger requests.
  const filterUserRef = React.useRef<HTMLInputElement>(null);
  // The user awaiting confirmation. null means the confirmation panel is hidden.
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, 3, '*'));
    })();
  }, [props.user, franchisePage]);

  React.useEffect(() => {
    // The modal only renders once the admin user has loaded, after the app-level autoInit has already run.
    HSOverlay.autoInit();
  }, [props.user]);

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  async function closeFranchise(franchise: Franchise) {
    navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
  }

  // Fetch one page (10 users) and remember which page/filter produced it.
  async function loadUsers(page: number, filter: string) {
    setUserList(await pizzaService.getUsers(page, 10, filter));
    setUserPage(page);
    setUserFilter(filter);
  }

  // Click handler for the Users button: reset the overlay, load page 1, then open it.
  async function openUserList() {
    if (filterUserRef.current) {
      filterUserRef.current.value = '';
    }
    setUserToDelete(null);
    await loadUsers(1, '*');
    HSOverlay.open(document.getElementById('hs-user-list-modal')!);
  }

  // Runs when Confirm is pressed: delete one user, hide the panel, then reload the list.
  async function confirmDeleteUser() {
    if (!userToDelete) return;
    await pizzaService.deleteUser(userToDelete);
    setUserToDelete(null);
    // Step back a page when the last user on a later page was deleted
    const page = userList.users.length === 1 && userPage > 1 ? userPage - 1 : userPage;
    await loadUsers(page, userFilter);
  }

  // Wraps the typed text in * wildcards (substring match) and restarts at page 1.
  async function filterUsers() {
    const value = filterUserRef.current?.value.trim();
    await loadUsers(1, value ? `*${value}*` : '*');
  }

  async function filterFranchises() {
    setFranchiseList(await pizzaService.getFranchises(franchisePage, 10, `*${filterFranchiseRef.current?.value}*`));
  }

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h3 className="text-neutral-100 text-xl">Franchises</h3>
            {/* Same row as the Franchises title; justify-between pushes the button to the right */}
            <Button className="w-20 p-0" title="Users" onPress={openUserList} />
          </div>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                        <tr>
                          {['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action'].map((header) => (
                            <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {franchiseList.franchises.map((franchise, findex) => {
                        return (
                          <tbody key={findex} className="divide-y divide-gray-200">
                            <tr className="border-neutral-500 border-t-2">
                              <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">{franchise.name}</td>
                              <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800" colSpan={3}>
                                {franchise.admins?.map((o) => o.name).join(', ')}
                              </td>
                              <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800" onClick={() => closeFranchise(franchise)}>
                                  <TrashIcon />
                                  Close
                                </button>
                              </td>
                            </tr>

                            {franchise.stores.map((store, sindex) => {
                              return (
                                <tr key={sindex} className="bg-neutral-100">
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800" colSpan={3}>
                                    {store.name}
                                  </td>
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">{store.totalRevenue?.toLocaleString()} ₿</td>
                                  <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                    <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => closeStore(franchise, store)}>
                                      <TrashIcon />
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        );
                      })}
                      <tfoot>
                        <tr>
                          <td className="px-1 py-1">
                            <input type="text" ref={filterFranchiseRef} name="filterFranchise" placeholder="Filter franchises" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                            <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterFranchises}>
                              Submit
                            </button>
                          </td>
                          <td colSpan={4} className="text-end text-sm font-medium">
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 " onClick={() => setFranchisePage(franchisePage - 1)} disabled={franchisePage <= 0}>
                              «
                            </button>
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" onClick={() => setFranchisePage(franchisePage + 1)} disabled={!franchiseList.more}>
                              »
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Preline modal: 'hs-overlay hidden' keeps it invisible until HSOverlay.open() is called */}
        <div role="dialog" aria-modal="true" aria-labelledby="user-list-title" id="hs-user-list-modal" className="hs-overlay hidden size-full fixed top-10 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none">
          <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)]">
            <div className="w-full flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto">
              <div className="flex justify-between items-center py-3 px-4 border-b bg-slate-200 rounded-t-xl">
                <h3 id="user-list-title" className="font-bold text-gray-800">
                  User List
                </h3>
                {/* data-hs-overlay makes Preline close the modal when this is clicked */}
                <button type="button" aria-label="Close" className="flex justify-center items-center size-7 text-sm font-semibold rounded-full border border-transparent text-gray-800 hover:bg-gray-100" data-hs-overlay="#hs-user-list-modal">
                  <CloseIcon className="" />
                </button>
              </div>
              {/* Inline confirmation, only rendered after a row's Delete was clicked. Sits above the scroll area so it stays visible. */}
              {userToDelete && (
                <div role="alert" className="m-4 mb-0 p-3 rounded-lg border border-orange-400 bg-orange-50 text-start text-sm text-gray-800">
                  <p>
                    Delete user <span className="font-semibold">{userToDelete.name}</span> ({userToDelete.email})? This cannot be undone.
                  </p>
                  <div className="mt-2 flex gap-x-2">
                    <button type="button" className="px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={confirmDeleteUser}>
                      Confirm
                    </button>
                    <button type="button" className="px-2 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50" onClick={() => setUserToDelete(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {/* Scrolls inside the modal; max-h-60 keeps the confirmation panel on screen */}
              <div className="p-4 overflow-y-auto max-h-60 text-start">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                    <tr>
                      {['Name', 'Email', 'Role', 'Action'].map((header) => (
                        <th key={header} scope="col" className="px-4 py-2 text-center text-xs font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* One row per user; Delete only stages the user, nothing is sent until Confirm */}
                    {userList.users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.roles?.map((r) => r.role).join(', ')}</td>
                        <td className="px-4 py-2 text-end">
                          <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => setUserToDelete(u)}>
                            <TrashIcon />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer: name filter on the left, previous/next page buttons on the right */}
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-1 py-2">
                        <input type="text" ref={filterUserRef} name="filterUser" placeholder="Filter users" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                        <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterUsers}>
                          Submit
                        </button>
                      </td>
                      <td className="text-end text-sm font-medium">
                        <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" onClick={() => loadUsers(userPage - 1, userFilter)} disabled={userPage <= 1}>
                          «
                        </button>
                        <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" onClick={() => loadUsers(userPage + 1, userFilter)} disabled={!userList.more}>
                          »
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
        </div>
      </View>
    );
  }

  return response;
}
