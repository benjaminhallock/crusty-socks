import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Transition } from "@headlessui/react";

import Button from "../common/ui/Button";
import { fetchLobby } from "../../services/api";

const CreateLobby = ({ user }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!user || localStorage.getItem("token") === null) {
      localStorage.removeItem("user");
      navigate("/");
    }
    setIsShowing(true);
  }, [navigate, user]);

  const handleCreateGame = () => navigate("/lobby/new");

  const handleJoinGame = async (e) => {
    e.preventDefault();
    const roomId = e.target.roomId.value.trim().split("/").pop();
    if (!roomId) return setError("Invalid Room ID");
    navigate(`/lobby/${roomId}`);
  };

  return (
    <div className= "flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <Transition
        as={Fragment}
        show={isShowing}
        enter="transition-all duration-500"
        enterFrom="opacity-0 translate-y-8"
        enterTo="opacity-100 translate-y-0"
        leave="transition-all duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="w-full max-w-md mx-auto">
          <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 transform-gpu">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Create or Join a Game
            </h1>

            <Button
              onClick={handleCreateGame}
              variant="primary"
              size="lg"
              fullWidth
              className="transform-gpu hover:scale-[1.02] transition-transform duration-200"
            >
              Create New Game
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                  or join existing game
                </span>
              </div>
            </div>

            <form onSubmit={handleJoinGame} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="roomId"
                  placeholder="Enter Room ID or paste invite link"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-900/50 
                    text-gray-800 dark:text-gray-200
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                    transition-all duration-200"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                fullWidth
                className="transform-gpu hover:scale-[1.02] transition-transform duration-200"
              >
                Join Game
              </Button>
            </form>

            <Transition
              show={!!error}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="mt-6"
            >
              <div className="bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default CreateLobby;
