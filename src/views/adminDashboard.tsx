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
  const [userList, setUserList] = React.useState<UserList>({ users: [], more: false });

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, 3, '*'));
    })();
  }, [props.user, franchisePage]);

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  async function closeFranchise(franchise: Franchise) {
    navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
  }

  async function openUserList() {
    setUserList(await pizzaService.getUsers(1, 10, '*'));
    HSOverlay.open(document.getElementById('hs-user-list-modal')!);
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
        <div role="dialog" aria-modal="true" aria-labelledby="user-list-title" id="hs-user-list-modal" className="hs-overlay hidden size-full fixed top-10 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none">
          <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)]">
            <div className="w-full flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto">
              <div className="flex justify-between items-center py-3 px-4 border-b bg-slate-200 rounded-t-xl">
                <h3 id="user-list-title" className="font-bold text-gray-800">
                  User List
                </h3>
                <button type="button" aria-label="Close" className="flex justify-center items-center size-7 text-sm font-semibold rounded-full border border-transparent text-gray-800 hover:bg-gray-100" data-hs-overlay="#hs-user-list-modal">
                  <CloseIcon className="" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-96 text-start">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                    <tr>
                      {['Name', 'Email', 'Role'].map((header) => (
                        <th key={header} scope="col" className="px-4 py-2 text-center text-xs font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userList.users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{u.roles?.map((r) => r.role).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
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
