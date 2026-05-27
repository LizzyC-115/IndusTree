import { useApp } from '../context/AppContext';

// Single-click: opens the user's profile directly (or own profile if it's the current user).
// The DM button lives inside UserProfileModal so users can still message from there.
export default function UserActionMenu({ user, children }) {
  const { currentUser, openProfile, openMyProfile } = useApp();

  const isOwnProfile =
    currentUser &&
    (currentUser.username === user?.name || currentUser.uid === user?.id);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isOwnProfile) openMyProfile();
    else openProfile(user);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-left cursor-pointer"
    >
      {children}
    </button>
  );
}
