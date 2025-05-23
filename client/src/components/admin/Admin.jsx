import { Transition } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { GAME_STATE as gs } from '../../constants';
import {
  fetchUserProfile,
  getAllChats,
  getAllLobbies,
  getAllReports,
  getAllUsers,
  getReportDetails,
  updateLobby,
  updateReport,
  updateReportStatus,
  updateUser,
} from '../../services/api';
import LoadingSpinner from '../common/ui/LoadingSpinner';

const Admin = () => {
  const [data, setData] = useState({
    users: { items: [], page: 1, pages: 1 },
    lobbies: { items: [], page: 1, pages: 1 },
    reports: { items: [], page: 1, pages: 1 },
    chats: { items: [], page: 1, pages: 1 },
  });
  const [uiState, setUiState] = useState({
    loading: true,
    error: '',
    activeView: 'users',
    currentPage: 1,
    modal: {
      isOpen: false,
      type: null,
      id: null,
      data: null,
      isEditing: false,
      loading: false,
      error: '',
    },
  });

  // Constants
  const ITEMS_PER_PAGE = 50;

  // Reset page when changing views
  useEffect(() => {
    setUiState((prev) => ({ ...prev, currentPage: 1 }));
  }, [uiState.activeView]);

  // Pagination helper functions
  const paginateData = (items) => {
    const startIndex = (uiState.currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  // Pagination controls component
  const PaginationControls = ({ currentData }) => {
    if (!currentData || currentData.pages <= 1) return null;

    return (
      <div className="flex justify-between items-center px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {(currentData.page - 1) * ITEMS_PER_PAGE + 1} to{' '}
          {Math.min(currentData.page * ITEMS_PER_PAGE, currentData.total)} of{' '}
          {currentData.total} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setUiState((prev) => ({
                ...prev,
                currentPage: Math.max(prev.currentPage - 1, 1),
              }))
            }
            disabled={uiState.currentPage === 1}
            className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <div className="flex items-center gap-2">
            {[...Array(currentData.pages)].map((_, i) => (
              <button
                key={i}
                onClick={() =>
                  setUiState((prev) => ({ ...prev, currentPage: i + 1 }))
                }
                className={`w-8 h-8 rounded ${
                  uiState.currentPage === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setUiState((prev) => ({
                ...prev,
                currentPage: Math.min(prev.currentPage + 1, currentData.pages),
              }))
            }
            disabled={uiState.currentPage === currentData.pages}
            className="px-3 py-1 rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Main data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      setUiState((prev) => ({ ...prev, loading: true, error: '' }));
      try {
        const params = {
          page: uiState.currentPage,
          limit: ITEMS_PER_PAGE,
        };

        let response;
        switch (uiState.activeView) {
          case 'users':
            response = await getAllUsers(params);
            console.log('Users response:', response); // Debug log
            if (response.success) {
              setData((prev) => ({
                ...prev,
                users: {
                  items: response.users || [],
                  total: response.total || 0,
                  page: response.page || 1,
                  pages: Math.max(
                    1,
                    Math.ceil(response.total / ITEMS_PER_PAGE)
                  ),
                },
              }));
            }
            break;
          case 'lobbies':
            response = await getAllLobbies(params);
            if (response.success) {
              setData((prev) => ({
                ...prev,
                lobbies: {
                  items: response.lobbies || [],
                  total: response.total || 0,
                  page: response.page || 1,
                  pages: response.pages || 1,
                },
              }));
            }
            break;
          case 'reports':
            response = await getAllReports(params);
            if (response.success) {
              setData((prev) => ({
                ...prev,
                reports: {
                  items: response.reports || [],
                  total: response.total || 0,
                  page: response.page || 1,
                  pages: response.pages || 1,
                },
              }));
            }
            break;
          case 'chats':
            response = await getAllChats(params);
            console.log('Chat response:', response); // Debug log
            if (response.success) {
              setData((prev) => ({
                ...prev,
                chats: {
                  items: response.chats || [],
                  total: response.total || 0,
                  page: response.page || 1,
                  pages: Math.max(
                    1,
                    Math.ceil(response.total / ITEMS_PER_PAGE)
                  ),
                },
              }));
            }
            break;
        }
      } catch (error) {
        setUiState((prev) => ({
          ...prev,
          error: `Failed to load ${uiState.activeView}`,
        }));
      } finally {
        setUiState((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, [uiState.activeView, uiState.currentPage]);

  const handleSort = (field) => {
    setUiState((prev) => ({
      ...prev,
      sortConfig: {
        field,
        direction:
          prev.sortConfig?.field === field &&
          prev.sortConfig?.direction === 'asc'
            ? 'desc'
            : 'asc',
      },
    }));
  };

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setUiState((prev) => ({ ...prev, error: '' }));
      const result = await updateReportStatus(reportId, newStatus);
      if (result.success && result.report) {
        setData((prev) => ({
          ...prev,
          reports: {
            ...prev.reports,
            items: prev.reports.items.map((report) =>
              report._id === reportId
                ? { ...report, status: newStatus }
                : report
            ),
          },
        }));
        showSuccessMessage('Report status updated successfully');
      } else {
        setUiState((prev) => ({
          ...prev,
          error:
            'Failed to update report status: ' +
            (result.error || 'Unknown error'),
        }));
      }
    } catch (error) {
      setUiState((prev) => ({
        ...prev,
        error:
          'An error occurred while updating report status: ' + error.message,
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUiState((prev) => ({
      ...prev,
      modal: {
        ...prev.modal,
        data: {
          ...prev.modal.data,
          [name]: type === 'checkbox' ? checked : value,
        },
      },
    }));
  };

  const showSuccessMessage = (message) => {
    setUiState((prev) => ({
      ...prev,
      successMessage: message,
    }));
    setTimeout(() => {
      setUiState((prev) => ({
        ...prev,
        successMessage: '',
      }));
    }, 3000);
  };

  // Replace handleViewDetails and handleEditClick with a single handler
  const handleItemClick = async (item, type) => {
    setUiState((prev) => ({
      ...prev,
      modal: {
        isOpen: true,
        type,
        id: item._id,
        data: item,
        isEditing: false,
        loading: true,
        error: '',
      },
    }));

    try {
      let result;
      switch (type) {
        case 'user':
          result = await fetchUserProfile(item.username);
          break;
        case 'report':
          result = await getReportDetails(item._id);
          break;
        case 'lobby':
          result = { success: true, lobby: item };
          break;
        default:
          throw new Error('Unknown type');
      }

      if (result.success) {
        setUiState((prev) => ({
          ...prev,
          modal: {
            ...prev.modal,
            data:
              result[type] || result.profile || result.report || result.lobby,
            loading: false,
          },
        }));
      }
    } catch (error) {
      setUiState((prev) => ({
        ...prev,
        modal: {
          ...prev.modal,
          error: `Failed to load ${type} details: ${error.message}`,
          loading: false,
        },
      }));
    }
  };

  const toggleEditMode = () => {
    setUiState((prev) => ({
      ...prev,
      modal: {
        ...prev.modal,
        isEditing: !prev.modal.isEditing,
      },
    }));
  };

  const closeModal = () => {
    setUiState((prev) => ({
      ...prev,
      modal: {
        isOpen: false,
        type: null,
        id: null,
        data: null,
        isEditing: false,
        loading: false,
        error: '',
      },
    }));
  };

  // Update the handleSaveEdit function
  const handleSaveEdit = async () => {
    const { type, id, data } = uiState.modal;
    try {
      let result;
      switch (type) {
        case 'user':
          result = await updateUser(id, data);
          break;
        case 'lobby':
          result = await updateLobby(id, data);
          break;
        case 'report':
          result = await updateReport(id, data);
          break;
        default:
          throw new Error('Unknown type');
      }

      if (result?.success) {
        // Update local data
        setData((prev) => ({
          ...prev,
          [type + 's']: {
            ...prev[type + 's'],
            items: prev[type + 's'].items.map((item) =>
              item._id === id ? result[type] : item
            ),
          },
        }));

        setUiState((prev) => ({
          ...prev,
          modal: {
            ...prev.modal,
            isEditing: false,
            data: result[type],
          },
        }));

        showSuccessMessage(`${type} updated successfully`);
      }
    } catch (err) {
      setUiState((prev) => ({
        ...prev,
        modal: {
          ...prev.modal,
          error: `Failed to save: ${err.message}`,
        },
      }));
    }
  };

  // Add state for modal details
  const renderModal = () => {
    const { isOpen, type, data, isEditing, loading, error } = uiState.modal;
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">
              {type?.charAt(0).toUpperCase() + type?.slice(1)} Details
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleEditMode}
                className="text-blue-400 hover:text-blue-300"
              >
                {isEditing ? 'View Mode' : 'Edit Mode'}
              </button>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded">
                {error}
              </div>
            ) : (
              <>
                {type === 'user' && (
                  <UserDetailContent
                    user={data}
                    isEditing={isEditing}
                    onSave={handleSaveEdit}
                    onChange={handleInputChange}
                  />
                )}
                {type === 'report' && (
                  <ReportDetailContent
                    report={data}
                    isEditing={isEditing}
                    onSave={handleSaveEdit}
                    onChange={handleInputChange}
                    onStatusChange={handleUpdateStatus}
                  />
                )}
                {type === 'lobby' && (
                  <LobbyDetailContent
                    lobby={data}
                    isEditing={isEditing}
                    onSave={handleSaveEdit}
                    onChange={handleInputChange}
                  />
                )}
              </>
            )}

            {isEditing && (
              <div className="flex justify-end mt-6 gap-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Update the renderContent function to add click handlers to rows
  const renderContent = () => {
    const currentData = data[uiState.activeView];
    console.log(`Rendering data for ${uiState.activeView}:`, currentData); // Debug logs

    switch (uiState.activeView) {
      case 'users':
        return (
          <div>
            {uiState.loading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Users
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {currentData.items.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleItemClick(user, 'user')}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                user.isAdmin
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {user.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(user, 'user');
                              }}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <PaginationControls currentData={data.users} />
          </div>
        );
      case 'lobbies':
        return (
          <div>
            {uiState.loading ? (
              <LoadingSpinner />
            ) : (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Active Lobbies
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Room ID
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Players
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Game State
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Round Time
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reveal %
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Current Round
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {currentData.items.map((lobby) => (
                        <tr
                          key={lobby._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                          onClick={() => handleItemClick(lobby, 'lobby')}
                        >
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                            {lobby.roomId}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                            {lobby.players?.length || 0}/
                            {lobby.playerLimit || 8}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                lobby.gameState === gs.WAITING
                                  ? 'bg-gray-500 text-white'
                                  : lobby.gameState === gs.PICKING_WORD
                                  ? 'bg-blue-500 text-white'
                                  : lobby.gameState === gs.DRAWING
                                  ? 'bg-green-500 text-white'
                                  : lobby.gameState === gs.DRAW_END
                                  ? 'bg-yellow-500 text-white'
                                  : lobby.gameState === gs.ROUND_END
                                  ? 'bg-purple-500 text-white'
                                  : lobby.gameState === gs.FINISHED
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }`}
                            >
                              {lobby.gameState
                                ? lobby.gameState.replace('_', ' ')
                                : 'WAITING'}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300 capitalize">
                            {lobby.selectCategory || 'random'}
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                            {lobby.roundTime || 60}s
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                            {lobby.revealCharacters || 35}%
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                            {lobby.currentRound || 1}/{lobby.maxRounds || 3}
                          </td>
                          <td
                            className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemClick(lobby, 'lobby');
                                }}
                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls currentData={data.lobbies} />
              </div>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Reports
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reported User
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reported By
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentData.items.map((report) => (
                    <tr
                      key={report._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => handleItemClick(report, 'report')}
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {report.reportedUser}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {report.reportedBy}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        <div className="max-w-xs">
                          <span className="font-medium">{report.reason}</span>
                          {report.additionalComments && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 truncate">
                              {report.additionalComments}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'pending'
                              ? 'bg-yellow-500 text-yellow-900'
                              : report.status === 'reviewed'
                              ? 'bg-blue-500 text-blue-900'
                              : 'bg-green-500 text-green-900'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
                        {new Date(report.timestamp).toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-2">
                          <select
                            value={report.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(report._id, e.target.value);
                            }}
                            className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded px-2 py-1 text-xs md:text-sm border border-gray-300 dark:border-gray-600"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(report, 'report');
                            }}
                            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs md:text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return (
          <div>
            {uiState.loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Chat Logs
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                        <tr>
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Message
                          </th>
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Lobby ID
                          </th>
                          <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.items.map((chat, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                              {chat.username}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                              {chat.message}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                              {chat.lobbyObjectId}
                            </td>
                            <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-900 dark:text-gray-300">
                              {new Date(chat.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <PaginationControls currentData={data.chats} />
              </>
            )}
          </div>
        );
    }
  };

  return (
    <Transition
      show={true}
      appear={true}
      enter="transition-all duration-300"
      enterFrom="opacity-0 translate-y-6"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-900/10 dark:via-purple-900/10 dark:to-pink-900/10 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Admin Dashboard
              </h1>
              {uiState.activeView !== 'overview' && (
                <button
                  onClick={() =>
                    setUiState((prev) => ({ ...prev, activeView: 'overview' }))
                  }
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Overview
                </button>
              )}
            </div>
            {uiState.error && (
              <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative">
                {uiState.error}
              </div>
            )}
            {uiState.successMessage && (
              <div className="mt-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded relative">
                {uiState.successMessage}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Users',
                view: 'users',
                icon: (
                  <svg
                    className="w-6 h-6 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Total Lobbies',
                view: 'lobbies',
                icon: (
                  <svg
                    className="w-6 h-6 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Total Reports',
                view: 'reports',
                icon: (
                  <svg
                    className="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ),
              },
              {
                label: 'Chat Logs',
                view: 'chats',
                icon: (
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                ),
              },
            ].map((stat, index) => (
              <button
                key={index}
                onClick={() =>
                  setUiState((prev) => ({ ...prev, activeView: stat.view }))
                }
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-full p-3 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition-colors">
                    {stat.icon}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          {renderContent()}
        </div>

        {/* Modal */}
        {renderModal()}
      </div>
    </Transition>
  );
};

const UserDetailContent = ({ user, isEditing, onSave, onChange }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) return <div>No user data available</div>;

  return (
    <div>
      <div className="border-b border-gray-700 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-4 ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-4 ${
              activeTab === 'stats'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400'
            }`}
          >
            Game Stats
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-4 ${
              activeTab === 'reports'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400'
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('chatHistory')}
            className={`py-2 px-4 ${
              activeTab === 'chatHistory'
                ? 'border-b-2 border-blue-500 text-white'
                : 'text-gray-400'
            }`}
          >
            Chat History
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-400 text-sm">Email</h3>
            {isEditing ? (
              <input
                name="email"
                value={user.email || ''}
                onChange={onChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
              />
            ) : (
              <p className="text-white">{user.email}</p>
            )}
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Account Status</h3>
            {isEditing ? (
              <select
                name="isActive"
                value={user.isActive ? 'active' : 'suspended'}
                onChange={onChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            ) : (
              <p className={user.isActive ? 'text-green-500' : 'text-red-500'}>
                {user.isActive ? 'Active' : 'Suspended'}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Role</h3>
            {isEditing ? (
              <select
                name="isAdmin"
                value={user.isAdmin ? 'admin' : 'player'}
                onChange={onChange}
                className="w-full p-2 bg-gray-700 text-white rounded"
              >
                <option value="admin">Admin</option>
                <option value="player">Player</option>
              </select>
            ) : (
              <p className="text-white">{user.isAdmin ? 'Admin' : 'Player'}</p>
            )}
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Created</h3>
            <p className="text-white">
              {new Date(user.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-400 text-sm">Games Played</h3>
            <p className="text-white">{user.stats?.gamesPlayed || 0}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Wins</h3>
            <p className="text-white">{user.stats?.wins || 0}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Correct Guesses</h3>
            <p className="text-white">{user.stats?.correctGuesses || 0}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-sm">Total Score</h3>
            <p className="text-white">{user.stats?.totalScore || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-white mb-2">Reports</h3>
          {user.reports && user.reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {user.reports.map((report) => (
                    <tr key={report._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(report.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {report.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded ${
                            report.status === 'resolved'
                              ? 'bg-green-900 text-green-300'
                              : report.status === 'reviewed'
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No reports found</p>
          )}
        </div>
      )}

      {activeTab === 'chatHistory' && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-white mb-2">
            Recent Chat History
          </h3>
          {user.chatHistory && user.chatHistory.length > 0 ? (
            <div className="bg-gray-700 rounded p-4 max-h-96 overflow-y-auto">
              {user.chatHistory.map((message, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400 text-xs">
                    {new Date(message.timestamp).toLocaleString()}:
                  </span>
                  <span className="ml-2 text-white">{message.message}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    (Room: {message.roomId})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No chat history found</p>
          )}
        </div>
      )}
    </div>
  );
};

const ReportDetailContent = ({
  report,
  isEditing,
  onSave,
  onChange,
  onStatusChange,
}) => {
  const [newStatus, setNewStatus] = useState(report?.status || 'pending');

  if (!report) return <div>No report data available</div>;

  const handleStatusUpdate = () => {
    if (newStatus !== report.status) {
      onStatusChange(report._id, newStatus);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-gray-400 text-sm">Reported User</h3>
          {isEditing ? (
            <input
              name="reportedUser"
              value={report.reportedUser || ''}
              onChange={onChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
          ) : (
            <p className="text-blue-400 hover:underline cursor-pointer">
              {report.reportedUser}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Reported By</h3>
          {isEditing ? (
            <input
              name="reportedBy"
              value={report.reportedBy || ''}
              onChange={onChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
          ) : (
            <p className="text-blue-400 hover:underline cursor-pointer">
              {report.reportedBy}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Room ID</h3>
          {isEditing ? (
            <input
              name="roomId"
              value={report.roomId || ''}
              onChange={onChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
          ) : (
            <p className="text-white">{report.roomId}</p>
          )}
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Date</h3>
          <p className="text-white">
            {new Date(report.timestamp).toLocaleString()}
          </p>
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Reason</h3>
          {isEditing ? (
            <textarea
              name="reason"
              value={report.reason || ''}
              onChange={onChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
              rows="2"
            />
          ) : (
            <p className="text-white">{report.reason}</p>
          )}
        </div>
        <div>
          <h3 className="text-gray-400 text-sm">Status</h3>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <select
                name="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            ) : (
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  report.status === 'pending'
                    ? 'bg-yellow-500 text-yellow-900'
                    : report.status === 'reviewed'
                    ? 'bg-blue-500 text-blue-900'
                    : 'bg-green-500 text-green-900'
                }`}
              >
                {report.status}
              </span>
            )}
            {isEditing && (
              <button
                onClick={handleStatusUpdate}
                disabled={newStatus === report.status}
                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
              >
                Update
              </button>
            )}
          </div>
        </div>
      </div>

      {report.additionalComments && (
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm mb-2">Additional Comments</h3>
          {isEditing ? (
            <textarea
              name="additionalComments"
              value={report.additionalComments || ''}
              onChange={onChange}
              className="w-full p-2 bg-gray-700 text-white rounded"
              rows="3"
            />
          ) : (
            <div className="bg-gray-700 rounded p-4 text-white">
              {report.additionalComments}
            </div>
          )}
        </div>
      )}

      {report.canvasData && (
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm mb-2">Drawing Evidence</h3>
          <div className="bg-white rounded overflow-hidden">
            <img
              src={report.canvasData}
              alt="Drawing Evidence"
              className="w-full h-auto"
              style={{ maxHeight: '300px' }}
            />
          </div>
        </div>
      )}

      {report.chatLogs && report.chatLogs.length > 0 && (
        <div>
          <h3 className="text-gray-400 text-sm mb-2">Chat Logs</h3>
          <div className="bg-gray-700 rounded p-4 max-h-64 overflow-y-auto">
            {report.chatLogs.map((message, index) => (
              <div key={index} className="mb-1">
                <span className="text-blue-400 hover:underline cursor-pointer">
                  {message.username}:
                </span>
                <span className="ml-1 text-white">{message.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LobbyDetailContent = ({ lobby, isEditing, onSave, onChange }) => {
  if (!lobby) return <div>No lobby data available</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">
            Lobby Information
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-gray-400">Room ID:</span>
              {isEditing ? (
                <input
                  name="roomId"
                  value={lobby.roomId || ''}
                  onChange={onChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              ) : (
                <span className="text-white ml-2">{lobby.roomId}</span>
              )}
            </div>
            <div>
              <span className="text-gray-400">Game State:</span>
              {isEditing ? (
                <select
                  name="gameState"
                  value={lobby.gameState || 'waiting'}
                  onChange={onChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                >
                  <option value={gs.WAITING}>Waiting</option>
                  <option value={gs.PICKING_WORD}>Picking Word</option>
                  <option value={gs.DRAWING}>Drawing</option>
                  <option value={gs.ROUND_END}>Round Ended</option>
                  <option value={gs.FINISHED}>Game Ended</option>
                </select>
              ) : (
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs ${
                    lobby.gameState === 'waiting'
                      ? 'bg-gray-500 text-white'
                      : lobby.gameState === 'picking_word'
                      ? 'bg-blue-500 text-white'
                      : lobby.gameState === 'drawing'
                      ? 'bg-green-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  {lobby.gameState?.replace('_', ' ') || 'waiting'}
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-400">Player Count:</span>
              <span className="text-white ml-2">
                {lobby.players?.length || 0}/{lobby.playerLimit || 8}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Round:</span>
              <span className="text-white ml-2">
                {lobby.currentRound || 1}/{lobby.maxRounds || 3}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Round Time:</span>
              {isEditing ? (
                <input
                  type="number"
                  name="roundTime"
                  min="30"
                  max="180"
                  value={lobby.roundTime || 60}
                  onChange={onChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                />
              ) : (
                <span className="text-white ml-2">
                  {lobby.roundTime || 60}s
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-400">Category:</span>
              {isEditing ? (
                <select
                  name="selectCategory"
                  value={lobby.selectCategory || 'random'}
                  onChange={onChange}
                  className="w-full p-2 bg-gray-700 text-white rounded"
                >
                  <option value="random">Random</option>
                  <option value="animals">Animals</option>
                  <option value="food">Food</option>
                  <option value="sports">Sports</option>
                  <option value="movies">Movies</option>
                  <option value="technology">Technology</option>
                </select>
              ) : (
                <span className="text-white ml-2 capitalize">
                  {lobby.selectCategory || 'random'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current Drawing */}
        {lobby.canvasData && (
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">
              Current Drawing
            </h3>
            <div className="bg-white rounded overflow-hidden">
              <img
                src={lobby.canvasData}
                alt="Current Drawing"
                className="w-full h-auto"
                style={{ maxHeight: '200px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Players Section */}
      <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-3">Players</h3>
        {lobby.players && lobby.players.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead>
                <tr className="text-left text-gray-400 text-xs">
                  <th className="p-2">Username</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lobby.players.map((player, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-600 hover:bg-gray-600/30"
                  >
                    <td className="p-2 text-white">{player.username}</td>
                    <td className="p-2 text-white">{player.score}</td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          player.username === lobby.currentDrawer
                            ? 'bg-green-500 text-white'
                            : player.hasGuessedCorrect
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {player.username === lobby.currentDrawer
                          ? 'Drawing'
                          : player.hasGuessedCorrect
                          ? 'Guessed'
                          : 'Guessing'}
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() =>
                          handleItemClick({ username: player.username }, 'user')
                        }
                        className="text-blue-400 hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No players in this lobby</p>
        )}
      </div>

      {/* Chat Messages Section */}
      <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-3">Chat Messages</h3>
        {lobby.messages && lobby.messages.length > 0 ? (
          <div className="bg-gray-800 rounded p-2 max-h-60 overflow-y-auto">
            {lobby.messages.map((message, index) => (
              <div key={index} className="mb-2 hover:bg-gray-700 p-1 rounded">
                <div className="flex justify-between">
                  <span className="font-bold text-blue-400 hover:underline cursor-pointer">
                    {message.user}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-300">{message.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No chat messages</p>
        )}
      </div>

      {/* Kicked Users Section */}
      {lobby.kickedUsers && lobby.kickedUsers.length > 0 && (
        <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-3">Kicked Users</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead>
                <tr className="text-left text-gray-400 text-xs">
                  <th className="p-2">Username</th>
                  <th className="p-2">Kicked At</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lobby.kickedUsers.map((kicked, index) => (
                  <tr key={index} className="border-t border-gray-600">
                    <td className="p-2 text-gray-300">{kicked.username}</td>
                    <td className="p-2 text-gray-300">
                      {new Date(kicked.kickedAt).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() =>
                          handleItemClick({ username: kicked.username }, 'user')
                        }
                        className="text-blue-400 hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
